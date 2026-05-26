# Scripts

Utilities for running, demoing, debugging, and re-deploying Connected Arena.

## Daily-driver scripts (you'll use these)

| Script | What it does |
|---|---|
| `demo_reset.py` | Resets the match so it can be replayed (keeps player XP). Run before every demo. `--full-reset` to wipe XP too. `--restore` to re-enable the EventBridge auto-scheduler. |
| `emit_events.py` | Streams the 91 match events live to every connected fan via WebSockets. Use `--speedup 60` for a 90-second demo, `--speedup 1` for real-time. |
| `parse_events.py` | One-time: parses the DFL XML into the DynamoDB `MatchEvents` table. |
| `redeploy_lambdas.py` | Re-deploys all backend Lambdas with **SHA hash verification** so you know your code is actually live. The canonical deploy command. |
| `render_architecture.py` | Re-renders `docs/architecture.svg` → `docs/architecture.png` with the real stadium logo composited on top. |
| `generate_demo_tickets.py` | Generates QR-coded sample match tickets (one per venue) into `docs/tickets/`. Judges can scan them on phones during the demo. |
| `requirements.txt` | Python deps: `boto3`, `websockets`. |

## `diagnostics/` — read-only inspection tools

Used when something looks wrong in production. None of these modify state.

| Script | Checks |
|---|---|
| `check_admin_conn.py` | What's stored in the `Connections` DynamoDB table for the admin session |
| `check_admin_logs.py` | Recent `AdminActionFunction` CloudWatch entries |
| `check_chat_history.py` | Contents of `GameRoom.chatHistory` (the persisted chat list) |
| `check_connect_logs.py` | Recent `ConnectFunction` CloudWatch entries |
| `check_iam.py` | Inline policies attached to the Connect Lambda's role |
| `check_players.py` | All player rows with their names, XP, prediction counts |
| `inspect_lambda.py` | Downloads deployed Lambda code, prints CHAT_HISTORY-related lines (verify what's live) |
| `raw_connect_log.py` | Dumps the latest Connect log stream as raw text |
| `trace_leaderboard.py` | Inspects the deployed Leaderboard Lambda + its recent logs |

## `setup/` — one-shot IAM and env-var fixes

Already executed in production. Kept as documentation / re-runnable in case of disaster recovery.

| Script | What it patched |
|---|---|
| `fix_lambda_env.py` | Added the 6 missing env vars (table names, WS endpoint) to `AdminActionFunction` and `ChatFunction` after they were created with only `REGION`. |
| `fix_role_permissions.py` | Added `execute-api:ManageConnections` and read access to Predictions / MatchEvents / GameRoom tables to the shared Connect role. |
| `fix_leaderboard_iam.py` | Added GetItem/Query/Scan on `Connections` and `GameRoom` to the Leaderboard Lambda's role (so it can resolve caller playerId and read chat history). |
