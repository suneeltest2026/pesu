'use strict';
/* Content pages. Every fact here comes from the store's published policies,
   held in settings so the admin can edit them without a deploy. */

module.exports = {
  about: (s) => ({
    eyebrow: 'About PESU',
    title: 'Create your calm',
    lede: 'Home decor for calm rooms, chosen in Dubai and delivered across the UAE.',
    body: `
      <p>PESU is a small home decor shop based in Dubai. We choose lamps, vases, trays and small
      sculptures that make a room feel settled — soft light, simple shapes, a few good objects
      rather than a crowd of them.</p>
      <p>Our pieces are made by production partners and shipped to you directly by our
      fulfilment partner, which is how we keep prices fair. We describe every piece plainly,
      including what it is made of and how long it takes to reach you.</p>
      <p>${s.shop_name} is based in ${s.shop_address}. Write to
      <a href="mailto:${s.shop_email}">${s.shop_email}</a> or call ${s.shop_phone}.</p>`
  }),

  delivery: (s) => ({
    eyebrow: 'Delivery',
    title: 'How your order reaches you',
    lede: `Delivered anywhere in the UAE in ${s.ship_dubai}, with tracking.`,
    body: `
      <dl class="totals">
        <dt>Preparing your order</dt><dd>${s.ship_processing}</dd>
        <dt>Delivery time</dt><dd>${s.ship_dubai}, to every emirate</dd>
        <dt>Cost</dt><dd>Free on orders of AED ${Number(s.ship_free_threshold_fils) / 100} and above;
          AED ${Number(s.ship_flat_fils) / 100} below that</dd>
        <dt>How it travels</dt><dd>Shipped directly to you by our fulfilment partner, by ${s.ship_courier}</dd>
      </dl>
      <p>We deliver within the United Arab Emirates only.</p>
      <p>Your order is shipped from our partner's warehouse rather than from Dubai, which is why
      it takes a little longer than a local courier. If you order several pieces they may arrive
      in separate parcels.</p>
      <p>Delivery times are estimates. Customs, public holidays and remote addresses can add to
      them.</p>
      <p>Once your order is on its way we will send you its tracking reference. You can also
      check any time on the <a href="/order-lookup">order tracking page</a>.</p>`
  }),

  returns: (s) => ({
    eyebrow: 'Returns',
    title: `${s.returns_days} days to change your mind`,
    lede: s.returns_note,
    body: `
      <p>You have ${s.returns_days} days from the day your order arrives to request a return. The
      piece must be unused, in its original packaging, with proof of purchase.</p>
      <p>To start a return, write to <a href="mailto:${s.shop_email}">${s.shop_email}</a>. We will
      confirm it and tell you where to send the piece. Sending it back is arranged and paid for by
      you &mdash; unless it arrived damaged or was not what you ordered, in which case write to us
      first and we will sort it out. Items sent back without requesting a return first cannot be
      accepted.</p>
      <p>Returns go to ${s.returns_address}.</p>
      <h3>Damaged or wrong item</h3>
      <p>Inspect your order when it arrives and contact us immediately if anything is damaged,
      defective, or not what you ordered. We will make it right.</p>
      <h3>What cannot be returned</h3>
      <p>Personalised or custom-made pieces, and anything that arrives back to us used or without
      its packaging.</p>
      <h3>Colour on screen</h3>
      <p>We photograph and describe every piece as accurately as we can, but colours can look a
      little different on a screen than in your room. That alone is not treated as a defect.</p>`
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
    title: 'Something for their home',
    lede: 'Send a piece straight to the person receiving it.',
    body: `
      <p>Every order can be sent straight to the person receiving it — add their address as the
      delivery address at checkout, and allow ${s.ship_dubai} for it to arrive.</p>
      <h3>Weddings and anniversaries</h3>
      <p>The dancing couple sculpture, or the glass dome rose lamp — both made for two.</p>
      <h3>Ramadan &amp; Eid</h3>
      <p>Candlelight for the table: the crystal candle holder, or the bamboo incense burner.</p>
      <h3>Housewarming</h3>
      <p>A twisted ceramic vase, a round metal tray, or the cotton ball string lights — useful,
      pretty, and not something they already own.</p>
      <p>Need something arranged? Write to <a href="mailto:${s.shop_email}">${s.shop_email}</a>.</p>`
  }),

  terms: (s) => ({
    eyebrow: 'Legal',
    title: 'Terms of sale',
    lede: `Trading as ${s.shop_name}, ${s.shop_address}.`,
    body: `
      <h3>Products</h3>
      <p>We describe our products as accurately as we can. Actual appearance may vary with screen
      settings and lighting. Minor variations in colour, size, finish or pattern are not defects.
      Products are supplied and shipped by our fulfilment partner.</p>
      <h3>Orders and prices</h3>
      <p>All prices are in UAE dirhams and include any applicable tax unless stated otherwise. We
      may correct pricing errors and cancel an affected order with a full refund.</p>
      <h3>Payment</h3>
      <p>Card payments are handled on the payment provider's own secure page. We never see or
      store your card details. We do not offer cash on delivery.</p>
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
      keep a record of what you bought. It is held in our own database, hosted for us in the
      European Union.</p>
      <h3>Payments</h3>
      <p>Card payments are processed by our payment provider on their own page. We receive a
      confirmation that payment succeeded and a reference — never your card number.</p>
      <h3>What we do not do</h3>
      <p>We do not sell your data. We share it only with our fulfilment partner, who packs and
      ships your order (and the e-commerce platform we use to pass orders to them), the courier
      delivering it, the payment provider processing your payment, and the companies that host
      this site and its database for us. They receive only what they need to do that job: your
      name, delivery address, phone number and what you ordered.</p>
      <h3>Email</h3>
      <p>We email you about your order. We only add you to our mailing list if you ask, and you
      can write to <a href="mailto:${s.shop_email}">${s.shop_email}</a> at any time to be taken
      off it.</p>
      <h3>Your rights</h3>
      <p>Write to <a href="mailto:${s.shop_email}">${s.shop_email}</a> to see what we hold about
      you, correct it, or have it deleted.</p>`
  })
};
