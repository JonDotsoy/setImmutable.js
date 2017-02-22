const {src, task, watch, dest} = require('lodash/bindAll')(require('gulp'), ['src', 'task', 'watch', 'dest'])
const babel = require('gulp-babel')

task('build', () =>
  src(['src/*.js'])
  .pipe(babel())
  .pipe(dest('.'))
)

