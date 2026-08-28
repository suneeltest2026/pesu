'use strict';
/* Content pages. Every fact here comes from the store's published policies,
   held in settings so the admin can edit them without a deploy. */

module.exports = {
  about: (s) => ({
    eyebrow: 'About PESU',
    title: 'Objects that were something else first',
    lede: 'Handmade home decor in natural materials, from Dubai.',
    body: `
      <p>Grass that grew in Odisha and was sun-dried, twisted into rope and braided by hand.
      Marble cut from a block and finished until it is cool and honest to the touch. Bamboo
      woven into a shade that throws uneven shadows across a wall.</p>
      <p>We look for objects that carry the evidence of the person who made them. That means
      colour, texture and finish vary from one piece to the next — a fact we would rather state
      plainly than photograph around. It is not a defect. It is the reason to buy the thing at all.</p>
      <p>Everything is chosen to work in a calm room: few materials, small scale, nothing that
      shouts. Priced so that a considered object is an ordinary purchase rather than an event.</p>
      <p>${s.shop_name} is based in ${s.shop_address}. Write to
      <a href="mailto:${s.shop_email}">${s.shop_email}</a> or call ${s.shop_phone}.</p>`
  }),

  delivery: (s) => ({
    eyebrow: 'Delivery',
    title: 'How your order reaches you',
    lede: `Dispatched in ${s.ship_processing} by ${s.ship_courier}.`,
    body: `
      <dl class="totals">
        <dt>Processing</dt><dd>${s.ship_processing} after payment is confirmed</dd>
        <dt>Dubai</dt><dd>${s.ship_dubai}</dd>
        <dt>Other emirates</dt><dd>${s.ship_emirates}</dd>
        <dt>International</dt><dd>${s.ship_international}</dd>
        <dt>Cost</dt><dd>Free on orders of AED ${Number(s.ship_free_threshold_fils) / 100} and above;
          AED ${Number(s.ship_flat_fils) / 100} below that</dd>
        <dt>Courier</dt><dd>${s.ship_courier} and trusted logistics partners</dd>
      </dl>
      <p>Delivery times are estimates. Customs clearance, weather, public holidays and remote
      addresses can add to them.</p>
      <p>Once your order is dispatched you will receive a confirmation with tracking where the
      courier provides it. You can also check any time on the
      <a href="/order-lookup">order tracking page</a>.</p>`
  }),

  returns: (s) => ({
    eyebrow: 'Returns',
    title: `${s.returns_days} days to change your mind`,
    lede: s.returns_note,
    body: `
      <p>You have ${s.returns_days} days from the day your order arrives to request a return. The
      piece must be unused, in its original packaging, with proof of purchase.</p>
      <p>To start a return, write to <a href="mailto:${s.shop_email}">${s.shop_email}</a>. We will
      send a return label and instructions. Items sent back without requesting a return first
      cannot be accepted.</p>
      <p>Returns go to ${s.returns_address}.</p>
      <h3>Damaged or wrong item</h3>
      <p>Inspect your order when it arrives and contact us immediately if anything is damaged,
      defective, or not what you ordered. We will make it right.</p>
      <h3>What cannot be returned</h3>
      <p>Personalised or custom-made pieces, and anything that arrives back to us used or without
      its packaging.</p>
      <h3>Handmade variation is not a fault</h3>
      <p>Our pieces are made by hand from natural materials. Differences in colour, texture, size
      and finish between one piece and the next are part of how they are made, and are not
      treated as defects.</p>`
  }),

  contact: (s) => ({
    eyebrow: 'Contact',
    title: 'Talk to a person',
    lede: 'We answer our own messages.',
    body: `
      <dl class="totals">
        <dt>Email</dt><dd><a href="mailto:${s.shop_email}">${s.shop_email}</a></dd>
        <dt>Phone</dt><dd><a href="tel:${String(s.shop_phone).replace(/\s/g, '')}">${s.shop_phone}</a></dd>
        <dt>Where we are</dt><dd>${s.shop_address}</dd>
        <dt>Returns to</dt><dd>${s.returns_address}</dd>
      </dl>
      <p>For an existing order, have your reference to hand — it looks like PESU-1001 and is in
      your confirmation email. You can also <a href="/order-lookup">track it here</a>.</p>`
  }),

  gifting: (s) => ({
    eyebrow: 'Gifting',
    title: 'Wrapped, checked, on its way',
    lede: 'Every order leaves in secure packaging, quality-checked before dispatch.',
    body: `
      <p>Most of the range is a gift you can send straight to the person receiving it. Add their
      address as the delivery address and a note in the delivery notes field at checkout.</p>
      <h3>Housewarming</h3>
      <p>The marble incense holder or the sabai grass tea light holder — small, considered, and
      not something they already own.</p>
      <h3>Ramadan &amp; Eid</h3>
      <p>Candlelight and calm: the Krishna t-light holder, or a pair for a table.</p>
      <h3>Diwali</h3>
      <p>Warm metal and light — the silver elephant bowl as a centrepiece.</p>
      <p>Need something arranged? Write to <a href="mailto:${s.shop_email}">${s.shop_email}</a>.</p>`
  }),

  terms: (s) => ({
    eyebrow: 'Legal',
    title: 'Terms of sale',
    lede: `Trading as ${s.shop_name}, ${s.shop_address}.`,
    body: `
      <h3>Products</h3>
      <p>We describe our products as accurately as we can. Actual appearance may vary with screen
      settings, lighting, handcrafted variation and natural materials. Minor variations in colour,
      texture, size, finish or pattern are not defects.</p>
      <h3>Orders and prices</h3>
      <p>All prices are in UAE dirhams and include any applicable tax unless stated otherwise. We
      may correct pricing errors and cancel an affected order with a full refund.</p>
      <h3>Payment</h3>
      <p>Card payments are handled on the payment provider's own secure page. We never see or
      store your card details. Cash on delivery is available within the UAE.</p>
      <h3>Delivery and returns</h3>
      <p>See <a href="/delivery">delivery</a> and <a href="/returns">returns</a>, which form part of
      these terms.</p>
      <h3>Product safety</h3>
      <p>Candles, incense and similar items must never be left unattended, and should be used on a
      heat-resistant surface away from anything flammable.</p>
      <h3>Liability</h3>
      <p>To the extent permitted by law, our total liability for any claim is limited to the amount
      paid for the product it relates to.</p>
      <h3>Contact</h3>
      <p><a href="mailto:${s.shop_email}">${s.shop_email}</a> · ${s.shop_phone}</p>`
  }),

  privacy: (s) => ({
    eyebrow: 'Legal',
    title: 'Privacy',
    lede: 'What we collect, why, and what we do not do with it.',
    body: `
      <h3>What we collect</h3>
      <p>To fulfil an order we collect your name, email, phone number and delivery address, and we
      keep a record of what you bought. That is all stored on our own server.</p>
      <h3>Payments</h3>
      <p>Card payments are processed by our payment provider on their own page. We receive a
      confirmation that payment succeeded and a reference — never your card number.</p>
      <h3>What we do not do</h3>
      <p>We do not sell your data, and we do not share it with anyone except the courier delivering
      your order and the payment provider processing your payment.</p>
      <h3>Email</h3>
      <p>We email you about your order. We only add you to our mailing list if you ask, and every
      email has an unsubscribe link.</p>
      <h3>Your rights</h3>
      <p>Write to <a href="mailto:${s.shop_email}">${s.shop_email}</a> to see what we hold about
      you, correct it, or have it deleted.</p>`
  })
};
