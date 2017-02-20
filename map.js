const set = require('./setImmutable')

function mapSetImmutable (obj, mapping) {
  return [obj, Object.keys(mapping)].reduce((...args) => {
    console.log(args)
  })
}


exports = module.exports = mapSetImmutable

