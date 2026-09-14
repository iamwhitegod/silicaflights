# SilicaFlights UI test requirements

Test the current local application at http://localhost:3000. This is a public flight-discovery website; no login is required. Cover the homepage and `/flights` at desktop (1445 × 900) and mobile (393 × 900), with an additional 320px overflow check.

## Current product boundaries

- Flight search uses the server-configured test/pre-production provider. Real returned airline offers, an empty result, and an actionable service error are all possible. Do not require a particular airline, fare, currency, or number of results for a successful UI test.
- No booking or payment flow is available. Founding-member and weekly-deals submissions are local demonstrations; test their validation and displayed feedback, not delivery or database persistence.
- Airport suggestions come from a local worldwide airport catalog. Choose actual suggestions rather than leaving unselected text. Use Lagos (LOS), Port Harcourt (PHC), and Abuja (ABV) for domestic search coverage.
- Compute future departure dates relative to the execution date; use seven days ahead and a return date seven days later. Do not hardcode expired dates.
- Report defects with steps, expected behavior, observed behavior, viewport, and screenshot/video evidence. Do not change application code or supplier settings.

## Priority UI scenarios

1. **Homepage search loading:** choose Lagos and Port Harcourt plus a valid future date. Delay the browser's navigation response to `/flights` by four seconds, submit once, and inspect the homepage while it is pending. Expect a visible spinner, “Searching…” label, disabled Search flights and input controls, and no duplicate navigation when clicking or pressing Enter again. This is a known suspected regression; report the actual outcome instead of weakening the assertion. Remove the delay afterward and verify navigation completes.
2. **Required fields and airport selection:** submit an empty form; verify associated validation feedback and focus on the first invalid field. Verify typed text without a selected airport is rejected, keyboard selection advances to the next field, and identical origin/destination is rejected.
3. **Search results and recovery:** submit a valid one-way search and confirm the URL retains the criteria. While the API is pending, controls must be disabled with a spinner. Verify either usable results or the appropriate empty/error state and recovery action. Test return navigation and editing the criteria.
4. **Advanced filter frame:** open Advanced settings and switch Flight details → Schedule → Travelers. The dialog must keep a stable height and position. Header, tabs, Cancel, and Apply stay visible while the active panel scrolls. Adding child-age fields and validation errors must not resize the frame. Repeat on a short mobile viewport.
5. **Draft reset and dismissal:** apply Business cabin, reopen, clear filters, and cancel. Business should still be applied when reopened. Repeat using Close and Escape. Clear followed by Apply must commit the defaults (one-way, economy, one adult, no children or infants). Clear stays beside Close and preserves the current tab.
6. **Dates, times, and travelers:** verify round trips require a return date in the main search form, date bounds are enforced, reversed time ranges show validation, children require ages 2–11, total travelers cannot exceed nine, and infants cannot exceed adults. Nested date/time pickers must close before the parent dialog and restore focus.
7. **Pinned search controls:** on a sufficiently long results page, scroll down and verify the search controls and Back link remain at the top; result count, filters, and cards scroll normally. On mobile, the pinned journey summary opens the search editor. If the provider returns no offers, report the long-list scenario as unavailable rather than inventing public results.
8. **Visual and responsive behavior:** verify no horizontal overflow at 320px, 393px, and 1445px. Selected trip/cabin pills use #437EFD with dark navy labels. Verify keyboard focus remains visible and the advanced dialog stays usable with text enlarged to 200%.
9. **Founding-member form:** verify missing/malformed email feedback, correction, and successful demo feedback with a reserved example.com address. Do not expect real enrollment.
10. **Weekly-deals form:** verify required name/email, optional departure and interest selections, chip removal, and successful demo feedback using a reserved example.com address. Do not expect an email to be sent.

Run a focused UI suite first. Stay within the available free account credits and do not purchase credits or enable recurring runs. Keep generated reports and execution artifacts under the ignored `testsprite_tests/` directory.
