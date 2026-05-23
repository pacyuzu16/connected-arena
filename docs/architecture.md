# Connected Arena — Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Cloud (eu-central-1)                      │
│                                                                       │
│  ┌──────────┐    ┌─────────────────┐    ┌──────────────────────┐    │
│  │    S3    │    │  EventBridge    │    │   CloudFront + S3    │    │
│  │ XML Data │    │  (rate 1 min)   │    │  Frontend Hosting    │    │
│  └────┬─────┘    └───────┬─────────┘    └──────────────────────┘    │
│       │                  │                         ↑                  │
│       ▼                  ▼                         │                  │
│  parse_events.py   EventEmitter λ          React SPA (fans)          │
│       │                  │                         │                  │
│       │            ┌─────┴──────┐                  │                  │
│       │            │            │                  │                  │
│       │       Broadcast λ  BedrockCommentary λ     │                  │
│       │            │       (Claude Haiku 4.5)      │                  │
│       │            │            │                  │                  │
│       ▼            ▼            ▼                  │                  │
│  ┌──────────────────────────────────────────────┐  │                  │
│  │         API Gateway WebSocket API            │◄─┘                  │
│  │  $connect  $disconnect  predict  leaderboard │                    │
│  └──────────────────────────────────────────────┘                    │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                        DynamoDB                              │     │
│  │  Connections │ Players │ Predictions │ MatchEvents │ GameRoom│     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Fan joins
1. Fan opens React app → WebSocket `$connect` → **ConnectFunction**
2. ConnectFunction stores connection + upserts player in DynamoDB
3. Frontend immediately requests leaderboard → **LeaderboardFunction** → `LEADERBOARD` message

### Match event fires
1. **EventBridge** triggers **EventEmitterFunction** every minute
2. EventEmitter queries next unprocessed event from `MatchEvents` table
3. If event resolves predictions (GOAL/WHISTLE) → scores fans inline
4. Invokes **BroadcastFunction** async → sends `MATCH_EVENT` to all WebSocket connections
5. For high-impact events → invokes **BedrockCommentaryFunction** async
6. Marks event as `processed = True`

### Fan makes a prediction
1. Frontend shows prediction modal (countdown timer)
2. Fan clicks Yes/No → WebSocket `predict` → **PredictFunction**
3. PredictFunction stores prediction in `Predictions` table
4. Sends `PREDICTION_ACK` back to fan

### Prediction resolves
1. Next GOAL event → EventEmitter calls `resolve_predictions_for_event()`
2. Scans open predictions, awards points to correct fans
3. Leaderboard auto-refreshes on frontend after GOAL

### AI Commentary
1. **BedrockCommentaryFunction** receives event type + team
2. Looks up each fan's persona (casual / passionate / stats_nerd)
3. Calls Amazon Bedrock (Claude Haiku 4.5 EU geo) with persona-specific prompt
4. Sends personalised `AI_COMMENTARY` message to each fan

## AWS Services

| Service | Usage |
|---|---|
| API Gateway WebSocket | Real-time fan connections |
| Lambda (Python 3.12) | All backend logic (7 functions) |
| DynamoDB (PAY_PER_REQUEST) | Connections, Players, Predictions, MatchEvents, GameRoom |
| Amazon Bedrock (Claude Haiku 4.5) | Personalised AI commentary |
| S3 | Match data (XML) + Frontend build artifacts |
| CloudFront | Frontend CDN (HTTPS, SPA routing) |
| EventBridge | Scheduled event emission (rate 1 min) |
| Lambda Layers | Shared `arena` utilities (ws, db, responses) |
