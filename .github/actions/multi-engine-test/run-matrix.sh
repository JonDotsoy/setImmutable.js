#!/usr/bin/env bash
# Runs every case in $CASES_INPUT against every engine in $ENGINES_INPUT,
# installing "setimmutable" from $TARBALL into an isolated dir per engine,
# and writes a markdown results table to $GITHUB_OUTPUT as "table".
set -uo pipefail

# Optional; the "default-type" action input, empty when unset.
DEFAULT_TYPE="${DEFAULT_TYPE:-}"

WORK="$RUNNER_TEMP/multi-engine-test"
rm -rf "$WORK"
mkdir -p "$WORK"

# --- Parse engines (one per non-empty line, e.g. "node 6", "bun latest") ---
mapfile -t ENGINES < <(printf '%s\n' "$ENGINES_INPUT" | sed '/^[[:space:]]*$/d')

# --- Parse cases (split on a line containing only "---") ---
CASES=()
current=""
first=true
while IFS= read -r line || [ -n "$line" ]; do
  if [ "$line" = "---" ]; then
    CASES+=("$current")
    current=""
    first=true
    continue
  fi
  if [ "$first" = true ]; then
    current="$line"
    first=false
  else
    current="$current
$line"
  fi
done <<< "$CASES_INPUT"
CASES+=("$current")

# --- Write each case to its own file ---
# A case can lead with any of these "// key: value" metadata comments,
# in any order, before its actual code -- each is stripped from the code
# before it runs, so a case never has to also be valid syntax:
#   // title: <label>      -- results-table label (default: code's 1st line)
#   // filename: <name>    -- the name the case runs as (default: case-N.<ext>)
#   // type: module|commonjs -- forces .mjs/.js (default: inferred, see below)
CASE_FILES=()
CASE_LABELS=()
for i in "${!CASES[@]}"; do
  case_text="${CASES[$i]}"
  title=""
  filename=""
  type=""
  remaining="$case_text"
  while true; do
    first_line="${remaining%%$'\n'*}"
    if [[ "$first_line" =~ ^//[[:space:]]*([A-Za-z_]+):[[:space:]]*(.*)$ ]]; then
      key=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
      value="${BASH_REMATCH[2]}"
      case "$key" in
        title) title="$value" ;;
        filename) filename="$value" ;;
        type) type="$value" ;;
      esac
      if [[ "$remaining" == *$'\n'* ]]; then
        remaining="${remaining#*$'\n'}"
      else
        remaining=""
      fi
    else
      break
    fi
  done
  code_text="$remaining"
  # Fallback chain: the case's own "// title:" comment, else its code's
  # own first line.
  label="${title:-$(echo "$code_text" | sed -n '1p')}"

  # Fallback chain for the effective type: the case's own "// type:"
  # comment, else the action's "default-type" input, else inferred from
  # a static/bare `import` statement or an `await` anywhere in the code
  # (these are simple top-level scripts, so `await` -- e.g.
  # `await import(...)` -- implies top-level await, which itself only
  # parses inside a real module).
  effective_type="${type:-$DEFAULT_TYPE}"
  case "$effective_type" in
    module) ext="mjs" ;;
    commonjs) ext="js" ;;
    *)
      if echo "$code_text" | grep -qE '^\s*import[[:space:]]|\bawait\b'; then
        ext="mjs"
      else
        ext="js"
      fi
      ;;
  esac

  # Fallback chain for the filename: the case's own "// filename:"
  # comment, else a slug of its label (so it reads as e.g.
  # "dynamic-esm-import.mjs" instead of "case-2.mjs"), else "case-N.ext"
  # if the label doesn't yield anything sluggable.
  if [ -n "$filename" ]; then
    file_basename="$filename"
  else
    slug=$(echo "$label" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
    file_basename="${slug:-case-$i}.$ext"
  fi

  file="$WORK/$file_basename"
  printf '%s\n' "$code_text" > "$file"
  CASE_FILES+=("$file")
  CASE_LABELS+=("$label")
done

# Composite action steps run bash with --noprofile --norc, so ~/.bashrc
# (where a preinstalled nvm normally wires up $NVM_DIR / the `nvm`
# function) never gets sourced -- bootstrap our own nvm explicitly
# rather than depend on that.
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash >/dev/null 2>&1
fi
nvm_sh="$NVM_DIR/nvm.sh"

install_node() {
  local version="$1"
  # shellcheck disable=SC1090
  source "$nvm_sh"
  case "$version" in
    lts) nvm install --lts >/dev/null 2>&1 ;;
    latest) nvm install node >/dev/null 2>&1 ;;
    *) nvm install "$version" >/dev/null 2>&1 ;;
  esac
}

run_node_case() {
  local version="$1" dir="$2" file="$3"
  # shellcheck disable=SC1090
  source "$nvm_sh"
  local resolved
  case "$version" in
    lts) resolved="--lts" ;;
    latest) resolved="node" ;;
    *) resolved="$version" ;;
  esac
  (cd "$dir" && nvm exec "$resolved" node "$file") >/dev/null 2>&1
}

install_deps_node() {
  local version="$1" dir="$2"
  # shellcheck disable=SC1090
  source "$nvm_sh"
  local resolved
  case "$version" in
    lts) resolved="--lts" ;;
    latest) resolved="node" ;;
    *) resolved="$version" ;;
  esac
  (cd "$dir" && nvm exec "$resolved" npm install "$TARBALL" --no-audit --no-fund --silent) >/dev/null 2>&1
}

install_bun() {
  local version="$1"
  if [ "$version" = "latest" ]; then
    curl -fsSL https://bun.sh/install | bash >/dev/null 2>&1
  else
    curl -fsSL https://bun.sh/install | bash -s "bun-v$version" >/dev/null 2>&1
  fi
}

run_bun_case() {
  local dir="$1" file="$2"
  (cd "$dir" && "$HOME/.bun/bin/bun" run "$file") >/dev/null 2>&1
}

install_deps_bun() {
  local dir="$1"
  (cd "$dir" && "$HOME/.bun/bin/bun" add "$TARBALL" >/dev/null 2>&1)
}

# --- Set up every engine + run every case, collecting ✅/❌ per cell ---
declare -A RESULTS
ENGINE_LABELS=()

for engine in "${ENGINES[@]}"; do
  read -r kind version <<< "$engine"
  engine_dir="$WORK/env-$(echo "$engine" | tr -c 'a-zA-Z0-9' '-')"
  mkdir -p "$engine_dir"
  ENGINE_LABELS+=("$engine")

  if [ "$kind" = "node" ]; then
    install_node "$version"
    install_deps_node "$version" "$engine_dir"
    deps_ok=$?
  elif [ "$kind" = "bun" ]; then
    install_bun "$version"
    install_deps_bun "$engine_dir"
    deps_ok=$?
  else
    echo "Unknown engine kind: $kind" >&2
    deps_ok=1
  fi

  for i in "${!CASE_FILES[@]}"; do
    # Node/Bun resolve `require`/`import` relative to the *file's own*
    # directory, not the process cwd -- so the case file has to actually
    # live next to the engine's node_modules, not just be run from there.
    file="$engine_dir/$(basename "${CASE_FILES[$i]}")"
    cp "${CASE_FILES[$i]}" "$file"
    if [ "$deps_ok" -ne 0 ]; then
      RESULTS["$i|$engine"]="❌"
      continue
    fi
    if [ "$kind" = "node" ]; then
      run_node_case "$version" "$engine_dir" "$file"
    else
      run_bun_case "$engine_dir" "$file"
    fi
    if [ $? -eq 0 ]; then
      RESULTS["$i|$engine"]="✅"
    else
      RESULTS["$i|$engine"]="❌"
    fi
  done
done

# --- Render the markdown table ---
{
  header="| Case |"
  sep="| --- |"
  for engine in "${ENGINE_LABELS[@]}"; do
    header="$header \`$engine\` |"
    sep="$sep --- |"
  done
  echo "### Multi-engine test results"
  echo
  echo "$header"
  echo "$sep"
  for i in "${!CASE_FILES[@]}"; do
    row="| ${CASE_LABELS[$i]} |"
    for engine in "${ENGINE_LABELS[@]}"; do
      row="$row ${RESULTS[$i|$engine]} |"
    done
    echo "$row"
  done
  echo
  for i in "${!CASE_FILES[@]}"; do
    echo "<details>"
    echo "<summary>Case $((i + 1)): ${CASE_LABELS[$i]}</summary>"
    echo
    echo '```js'
    cat "${CASE_FILES[$i]}"
    echo '```'
    echo
    echo "</details>"
    echo
  done
} > "$WORK/table.md"

{
  echo "table<<MULTI_ENGINE_TABLE_EOF"
  cat "$WORK/table.md"
  echo "MULTI_ENGINE_TABLE_EOF"
} >> "$GITHUB_OUTPUT"
