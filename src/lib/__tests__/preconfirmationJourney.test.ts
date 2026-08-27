import { describe, expect, it } from "vitest";
import {
  createPreconfirmationIdentity,
  createPreconfirmationJourneyDraft,
  parsePreconfirmationIdentity,
  parsePreconfirmationJourneyDraft,
} from "../preconfirmationJourney";

const NOW = Date.UTC(2026, 7, 22, 12);

describe("pre-confirmation journey ownership", () => {
  it("restores a fresh draft only for the account that created it", () => {
    const identity = createPreconfirmationIdentity("user-a", NOW);
    const draft = createPreconfirmationJourneyDraft(identity, {
      persona: "student_monde",
      pathwayVariant: "TOURISM",
      languageId: "deutsch",
    }, NOW);

    expect(parsePreconfirmationJourneyDraft(JSON.stringify(draft), "user-a", NOW)).toEqual(draft);
    expect(parsePreconfirmationJourneyDraft(JSON.stringify(draft), "user-b", NOW)).toBeNull();
  });

  it("never replays an unowned public-preview draft into an authenticated account", () => {
    const draft = createPreconfirmationJourneyDraft(null, {
      persona: "family",
      languageId: "wolof",
    }, NOW);

    expect(draft.authUserId).toBeNull();
    expect(parsePreconfirmationJourneyDraft(JSON.stringify(draft), "user-a", NOW)).toBeNull();
  });

  it("expires identities and drafts after seven days", () => {
    const identity = createPreconfirmationIdentity("user-a", NOW);
    const draft = createPreconfirmationJourneyDraft(identity, { persona: "teacher" }, NOW);
    const afterExpiry = NOW + 7 * 24 * 60 * 60 * 1000 + 1;

    expect(parsePreconfirmationIdentity(JSON.stringify(identity), afterExpiry)).toBeNull();
    expect(parsePreconfirmationJourneyDraft(JSON.stringify(draft), "user-a", afterExpiry)).toBeNull();
  });

  it("rejects malformed, future-dated and unsupported records", () => {
    expect(parsePreconfirmationIdentity("not-json", NOW)).toBeNull();
    expect(parsePreconfirmationJourneyDraft(JSON.stringify({
      version: 2,
      authUserId: "user-a",
      createdAt: NOW,
      persona: "family",
    }), "user-a", NOW)).toBeNull();
    expect(parsePreconfirmationJourneyDraft(JSON.stringify({
      version: 1,
      authUserId: "user-a",
      createdAt: NOW + 6 * 60 * 1000,
      persona: "family",
    }), "user-a", NOW)).toBeNull();
  });
});
