# YEMA · Canonical Persona Funnel

## Product rule

YEMA uses one confirmed adult identity per adult user. The landing sends adults to registration, confirmation leads to persona selection, each persona owns its onboarding, and later sign-ins reopen that exact persona space.

## Public path

`Landing → Register → Confirm email/OAuth → Persona choice → Persona onboarding → Persona dashboard`

Registration captures adult first name, last name, email and password. Phone/city/professional details belong to onboarding/profile, not identity creation.

## Personas

### Adult email identities

1. Student Monde
2. Student Racines
3. Family / Parent
4. Teacher
5. Roots Coach
6. Center Admin
7. Super Admin — assigned by YEMA, not self-service

### Child profiles without email

8. Child Monde
9. Child Racines

Children are created under the Family adult and authenticate through signed child session + PIN.

## Exact homes

| Persona | Onboarding | Home |
| --- | --- | --- |
| Student Monde | `/onboarding/monde` | `/dashboard` |
| Student Racines | `/onboarding/racines` | `/dashboard` |
| Family | `/onboarding/family` | `/family` |
| Teacher | `/onboarding/teacher` | `/teacher` |
| Roots Coach | `/onboarding/coach` | `/coach/racines` |
| Center Admin | `/onboarding/center` | `/center` |
| Super Admin | trusted provisioning | `/admin` |
| Child Monde | parent creates child + PIN | child Monde dashboard |
| Child Racines | parent creates child + PIN | child Racines dashboard |

The canonical server persona resolver decides login/callback/home routing. Direct persona URLs also enforce incomplete onboarding and cannot be used to skip it.

## Professional trust boundary

Teacher, Center and Roots Coach are not Production self-service roles. Browser persona selection records a request only. Trusted approval creates the professional role.

Canonical P-1 technical QA may auto-activate these personas so seven separate adult test accounts can complete their actual onboarding/dashboard. Super Admin remains non-self-service even on the public selector.

Center onboarding creates/updates the LanguageCenter, writes `User.centerId` and persists the private Center membership binding in the same database transaction. The connected Center representative identity is projected in the Center workspace while the organization name remains primary.

## Identity projection

Saved adult identity is projected into the persona experience:

- Student Monde / Racines greeting;
- Family guardian;
- Teacher;
- Roots Coach;
- Center representative while organization name remains the Center title;
- Super Admin through the existing admin profile.

`user_metadata` carries only UX/profile intent. Authorization remains DB-derived.

## Offers and same-account learning

Commercial selection is profile intent until checkout is connected. It never grants access by itself.

- Passage A1–C1 → Student Monde
- Racines Solo → Student Racines
- Racines Family → Family
- Roots Solo add-on → existing Student Monde account

Student Monde can therefore keep one login while retaining an intent for both foreign-language and heritage-language learning. World and Roots progress remain separate.

## QA definition of done

The matrix is considered ready only when:

- seven distinct adult emails exist on P-1;
- all seven have non-empty `fullName`;
- Student Monde/Racines have correct active LearningPaths;
- Family has PARENT and both child profiles with PINs;
- Teacher has trusted Teacher binding;
- Coach has RACINES_COACH and completed onboarding;
- Center has CENTER role, `centerId`, LanguageCenter and private membership binding;
- Super Admin has active ADMIN;
- later login reopens the exact persona home;
- no child has an email identity;
- pricing intent creates no Order, AccessGrant or charge.

## P-1 verification sequence

After creating the seven adult accounts through the public UI and creating Child Monde + Child Racines from the Family account:

1. place the seven adult emails in the local `.env.p1-baseline` variables documented by `.env.p1-baseline.example`;
2. run `npm run verify:persona-accounts:p1` for the read-only DB contract;
3. run `npm run test:personas:p1` for authenticated persona routing/session assertions using the P-1 QA credentials available locally;
4. run `npm run test:release-gate:p1` for the consolidated release gate;
5. only then consider the persona funnel runtime-complete.

The account verifier never creates accounts, changes passwords or writes database rows.
