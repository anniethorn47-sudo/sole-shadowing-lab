# Teacher Dashboard v4.7

## Main list
One row = one `student_id`. The row summarizes matched submissions and shows class, question count, pending/accepted/retry counts, average Shadow, average Recall, and latest submission.

## Student drill-down
Click **View questions** to see every practiced question matching the current filter set. Individual questions retain their own teacher review status and Review button.

## Combined filters
All filters are AND-combined between categories and OR-combined inside a multi-select category:
- multiple classes
- multiple students
- status
- topic
- multiple years
- multiple months
- multiple weeks in month
- text search

Example: select `IELTS1 + IELTS2`, students `An + Mai`, years `2026`, months `Aug + Sep`, and weeks `W1 + W2` to see only matching questions for those accounts.

Class values are normalized for filtering, so capitalization differences do not split a class.
