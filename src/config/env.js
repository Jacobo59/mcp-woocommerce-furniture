const requiredEnv = [
  'WOOCOMMERCE_URL',
  'WOOCOMMERCE_CONSUMER_KEY',
  'WOOCOMMERCE_CONSUMER_SECRET'
]

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`)
  }
})

module.exports = {
  port: process.env.PORT || 3000,
  woo: {
    url: process.env.WOOCOMMERCE_URL,
    key: process.env.WOOCOMMERCE_CONSUMER_KEY,
    secret: process.env.WOOCOMMERCE_CONSUMER_SECRET
  }
}
