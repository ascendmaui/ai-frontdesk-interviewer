import test from "node:test";
import assert from "node:assert/strict";
import { createOffer } from "../src/lib/offer";

test("default closer offer is commission-only and collected-revenue based", () => {
  const previousTerms = process.env.OFFER_TERMS_HTML;
  const previousComp = process.env.OFFER_COMMISSION_BLURB;
  delete process.env.OFFER_TERMS_HTML;
  delete process.env.OFFER_COMMISSION_BLURB;
  try {
    const offer = createOffer("hvac-closer");
    assert.match(offer.body, /Commission-only/i);
    assert.match(offer.body, /collected and cleared/i);
    assert.match(offer.body, /unpaid invoice/i);
    assert.match(offer.body, /chargeback/i);
    assert.match(offer.body, /formal signed documents/i);
  } finally {
    if (previousTerms === undefined) delete process.env.OFFER_TERMS_HTML;
    else process.env.OFFER_TERMS_HTML = previousTerms;
    if (previousComp === undefined) delete process.env.OFFER_COMMISSION_BLURB;
    else process.env.OFFER_COMMISSION_BLURB = previousComp;
  }
});
