const Stripe = require('stripe');
const stripe = Stripe(process.env.VUE_APP_API_STRIPE_SK);

export default stripe
