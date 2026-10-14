<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the visual identity in semantic tokens in src/styles.css and reuse the shared Button component across the conference screens, so appearance can change without changing counting rules.
- Keep the quantity calculator in a shared dialog and evaluate arithmetic through a restricted expression library, so all currencies transfer results consistently without executing code.
- Derive denomination-level report rows in the shared report-data module for both the screen and PDF, preserving the counting catalog and keeping all arithmetic in integer cents.
- Render PDF and browser printing from the same two A4 sheets in ReportDocument, fitting overflow uniformly without truncating notes, so both outputs remain identical and retain all report data.
- Validate map dates through the shared local-calendar helper and the date input limit at submission, so typed dates cannot bypass calendar restrictions.
