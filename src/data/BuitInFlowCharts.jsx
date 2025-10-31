 export const BUILT_IN_FLOWCHARTS = [
  {
    id: "f-login",
    name: "Login Flow",
    category: "Auth",
    description: "User submits credentials, validate and route.",
    code: `flowchart TD
Start([Start]) --> Input[Enter credentials]
Input --> Validate{Valid?}
Validate -->|Yes| Success[Go to Dashboard]
Validate -->|No| Error[Show error message]
Error --> Input
Success --> End([End])`,
  },
  {
    id: "f-register",
    name: "Registration",
    category: "Auth",
    description: "Sign up flow with email verification.",
    code: `flowchart TD
A[Start] --> B[User enters details]
B --> C[Create account]
C --> D[Send verification email]
D --> E{Email confirmed?}
E -->|Yes| F[Activate account]
E -->|No| G[Resend email]
F --> H[End]`,
  },
  {
    id: "f-checkout",
    name: "E-commerce Checkout",
    category: "Commerce",
    description: "Cart -> shipping -> payment -> confirmation.",
    code: `flowchart TD
Cart[Cart] --> Shipping[Shipping details]
Shipping --> Payment[Payment details]
Payment --> Review[Review order]
Review --> Confirm{Confirm?}
Confirm -->|Yes| Place[Place order]
Place --> Confirmation[Show confirmation]
Confirm -->|No| Cancel[Cancel]
Confirmation --> End`,
  },
  {
    id: "f-payment",
    name: "Payment Processing",
    category: "Commerce",
    description: "Validate cards, process payment, notify.",
    code: `flowchart TD
A[Start] --> B[Collect card info]
B --> C{Card valid?}
C -->|No| D[Show error]
C -->|Yes| E[Send to payment gateway]
E --> F{Payment success?}
F -->|Yes| G[Success page]
F -->|No| H[Failed page]`,
  },
  {
    id: "f-api",
    name: "API Request Cycle",
    category: "System",
    description: "Client -> API -> backend -> DB -> response",
    code: `flowchart TD
U[User action] --> FE[Frontend sends request]
FE --> API[API Gateway]
API --> Service[Service logic]
Service --> DB[Database]
DB --> Service
Service --> API
API --> FE[Return response]`,
  },
  {
    id: "f-crud",
    name: "CRUD Operation",
    category: "System",
    description: "Create, Read, Update, Delete decision flow",
    code: `flowchart TD
Start --> Choose{Operation?}
Choose -->|Create| Create[Insert record]
Choose -->|Read| Read[Fetch record]
Choose -->|Update| Update[Modify record]
Choose -->|Delete| Delete[Remove record]
Create --> Done[Done]
Read --> Done
Update --> Done
Delete --> Done`,
  },
  {
    id: "f-cache",
    name: "Cache Lookup",
    category: "System",
    description: "Check cache, fallback to DB, set cache.",
    code: `flowchart TD
Request --> Cache[Check cache]
Cache -->|Hit| Return[Return cached]
Cache -->|Miss| DB[Query DB]
DB --> Return
DB --> CacheSet[Set cache]`,
  },
  {
    id: "f-pipeline",
    name: "Data Pipeline",
    category: "Data",
    description: "Ingest -> Process -> Store -> Serve",
    code: `flowchart TD
Ingest --> Transform[Transform data]
Transform --> Validate{Valid?}
Validate -->|Yes| Store[Store]
Validate -->|No| Reject[Reject]
Store --> Serve[Serve to consumers]`,
  },
  {
    id: "f-etl",
    name: "ETL Job",
    category: "Data",
    description: "Extract, transform, load batch job",
    code: `flowchart TD
Start --> Extract[Extract data]
Extract --> Transform[Transform]
Transform --> Load[Load into warehouse]
Load --> Verify[Verify]
Verify --> End`,
  },
  {
    id: "f-ci",
    name: "CI Pipeline",
    category: "DevOps",
    description: "Commit -> Build -> Test -> Deploy",
    code: `flowchart TD
Commit --> Build[Build artifacts]
Build --> Test[Run tests]
Test -->|Pass| Deploy[Deploy to staging]
Test -->|Fail| Notify[Notify devs]
Deploy --> Monitor`,
  },
  {
    id: "f-cd",
    name: "CD Pipeline",
    category: "DevOps",
    description: "Deploy promotion pipeline",
    code: `flowchart TD
Staging --> Smoke[Smoke tests]
Smoke -->|Pass| Prod[Promote to prod]
Smoke -->|Fail| Rollback[Rollback]`,
  },
  {
    id: "f-queue",
    name: "Queue Worker",
    category: "System",
    description: "Consume -> process -> ack/requeue",
    code: `flowchart TD
Producer --> Queue
Worker --> Consume[Consume message]
Consume --> Process[Process]
Process -->|Success| Ack[Acknowledge]
Process -->|Fail| Requeue[Requeue or dead-letter]`,
  },
  {
    id: "f-authz",
    name: "Authorization",
    category: "Security",
    description: "Check tokens & permissions",
    code: `flowchart TD
Request --> CheckAuth[Check token]
CheckAuth -->|Invalid| Deny[403]
CheckAuth -->|Valid| CheckPerms{Has perms?}
CheckPerms -->|Yes| Allow[Allow]
CheckPerms -->|No| Deny`,
  },
  {
    id: "f-2fa",
    name: "2FA Flow",
    category: "Security",
    description: "OTP verification flow",
    code: `flowchart TD
Login --> OTP[Send OTP]
OTP --> Verify{Correct?}
Verify -->|Yes| Grant[Grant access]
Verify -->|No| Retry[Retry or block]`,
  },
  {
    id: "f-bug",
    name: "Bug Triage",
    category: "Process",
    description: "Report -> Triage -> Fix -> Release",
    code: `flowchart TD
Report --> Triage[Assess severity]
Triage -->|High| Hotfix[Hotfix]
Triage -->|Low| Backlog[Backlog]
Hotfix --> Release
Backlog --> Plan`,
  },
  {
    id: "f-support",
    name: "Support Ticket",
    category: "Process",
    description: "Create -> assign -> resolve",
    code: `flowchart TD
Customer --> Create[Create ticket]
Create --> Assign[Assign team]
Assign --> Work[Work on ticket]
Work --> Resolve[Resolved]`,
  },
  {
    id: "f-email",
    name: "Email Send",
    category: "Integration",
    description: "Compose -> send -> bounce handling",
    code: `flowchart TD
Compose --> Send[Send email]
Send -->|Delivered| Done
Send -->|Bounced| Bounce[Handle bounce]`,
  },
  {
    id: "f-webhook",
    name: "Webhook Delivery",
    category: "Integration",
    description: "Deliver -> retry -> dead-letter",
    code: `flowchart TD
Event --> Deliver[POST to endpoint]
Deliver -->|200| Done
Deliver -->|non-200| Retry[Retry with backoff]
Retry --> Dead[Dead-letter if exhausted]`,
  },
  {
    id: "f-rate",
    name: "Rate Limiting",
    category: "System",
    description: "Allow/deny requests based on quota",
    code: `flowchart TD
Request --> CheckQuota{Within quota?}
CheckQuota -->|Yes| Forward
CheckQuota -->|No| Throttle[Return 429]`,
  },
  {
    id: "f-rollback",
    name: "Deployment Rollback",
    category: "DevOps",
    description: "Failure detection and rollback steps",
    code: `flowchart TD
Deploy --> Monitor[Monitor metrics]
Monitor -->|Alert| Investigate
Investigate -->|Severe| Rollback
Rollback --> Notify`,
  },
  {
    id: "f-state",
    name: "State Machine",
    category: "System",
    description: "Basic state transitions",
    code: `flowchart TD
Idle --> Start --> Running --> Pause --> Running
Running --> Stop --> Idle`,
  },
  {
    id: "f-search",
    name: "Search Flow",
    category: "UX",
    description: "Query parsing, autocomplete, results",
    code: `flowchart TD
User --> Query[Type query]
Query --> Autocomplete{Suggest?}
Autocomplete -->|Yes| ShowSuggestions
Query --> SearchBackend
SearchBackend --> Results[Show results]`,
  },
  {
    id: "f-rating",
    name: "Feedback Loop",
    category: "UX",
    description: "Collect feedback and action",
    code: `flowchart TD
Prompt --> Submit[User submits]
Submit --> Analyze[Analyze sentiment]
Analyze --> Action[Improve product]`,
  },
  {
    id: "f-ml",
    name: "ML Training",
    category: "Data",
    description: "Data prepare -> train -> eval -> deploy",
    code: `flowchart TD
Collect --> Prepare[Prepare dataset]
Prepare --> Train[Train model]
Train --> Eval[Evaluate]
Eval -->|OK| Deploy
Eval -->|Not OK| Tune`,
  },
  {
    id: "f-cache-warm",
    name: "Warm Cache",
    category: "Data",
    description: "Precompute frequently used entries",
    code: `flowchart TD
Start --> Identify[Identify hot keys]
Identify --> Precompute
Precompute --> LoadCache`,
  },
  {
    id: "f-sso",
    name: "SSO Flow",
    category: "Auth",
    description: "Redirect to provider and callback",
    code: `flowchart TD
App --> Redirect[Redirect to SSO]
Redirect --> Provider
Provider --> Callback[Return to app]
Callback --> Session[Create session]`,
  },
  {
    id: "f-webapp",
    name: "Page Load",
    category: "UX",
    description: "Initial assets & hydrate client",
    code: `flowchart TD
Browser --> Request
Request --> Server[Send HTML]
Server --> Browser[Browser receives]
Browser --> Hydrate`,
  },
  {
    id: "f-queue-backoff",
    name: "Retry Backoff",
    category: "System",
    description: "Retries with exponential backoff",
    code: `flowchart TD
Try --> Fail{Failed?}
Fail -->|Yes| Backoff[Wait & retry]
Backoff --> Try
Try -->|Success| Done`,
  },
  {
    id: "f-logout",
    name: "Logout Flow",
    category: "Auth",
    description: "Clear session and redirect",
    code: `flowchart TD
ClickLogout --> Clear[Clear session]
Clear --> Redirect[Go to homepage]`,
  },
  {
    id: "f-batch",
    name: "Batch Job",
    category: "Data",
    description: "Batch schedule/run/notify",
    code: `flowchart TD
Schedule --> StartBatch[Start job]
StartBatch --> Process
Process --> Report
Report --> Notify`,
  },
  {
    id: "f-webperf",
    name: "Perf Optimization",
    category: "Ops",
    description: "Detect & optimize hotspots",
    code: `flowchart TD
Detect --> Profile[Profile]
Profile --> Optimize
Optimize --> Deploy`,
  },

  // --- New 20 flowcharts below ---
  {
    id: "f-incident",
    name: "Incident Response",
    category: "Ops",
    description: "Detect incident -> mitigate -> resolve -> postmortem.",
    code: `flowchart TD
Alert --> Triage{Severity?}
Triage -->|High| Escalate[Escalate to team]
Triage -->|Low| Monitor
Escalate --> Mitigate[Apply fix]
Mitigate --> Resolve[Close incident]
Resolve --> Postmortem[Document learnings]`,
  },
  {
    id: "f-abtest",
    name: "A/B Testing",
    category: "UX",
    description: "Split users -> track -> analyze results.",
    code: `flowchart TD
Users --> Split{Group?}
Split -->|A| VariantA
Split -->|B| VariantB
VariantA --> CollectA[Collect metrics A]
VariantB --> CollectB[Collect metrics B]
CollectA --> Compare
CollectB --> Compare
Compare --> Decision[Select best variant]`,
  },
  {
    id: "f-pushnotif",
    name: "Push Notification",
    category: "Integration",
    description: "Prepare, send, track, and retry notifications.",
    code: `flowchart TD
Compose --> Validate
Validate -->|OK| Send[Send push]
Send --> Track[Track delivery]
Track --> Retry{Failed?}
Retry -->|Yes| Resend
Retry -->|No| Done`,
  },
  {
    id: "f-backup",
    name: "Backup Process",
    category: "System",
    description: "Schedule, backup, verify and store securely.",
    code: `flowchart TD
Schedule --> Snapshot[Take backup]
Snapshot --> Verify[Verify integrity]
Verify -->|OK| Store[Upload to S3]
Verify -->|Fail| Alert[Notify admin]`,
  },
  {
    id: "f-restore",
    name: "Restore Workflow",
    category: "System",
    description: "Retrieve backup and restore system.",
    code: `flowchart TD
RequestRestore --> Fetch[Fetch backup]
Fetch --> Validate[Validate files]
Validate -->|Pass| Restore[Restore DB]
Validate -->|Fail| Retry[Try another snapshot]
Restore --> Notify[Send success email]`,
  },
  {
    id: "f-websocket",
    name: "WebSocket Connection",
    category: "Integration",
    description: "Open -> message -> close -> retry",
    code: `flowchart TD
Client --> Connect[Open socket]
Connect --> Connected{Connected?}
Connected -->|Yes| Listen[Receive messages]
Connected -->|No| Retry[Reconnect]
Listen --> Close[Close socket]`,
  },
  {
    id: "f-error-log",
    name: "Error Logging",
    category: "System",
    description: "Capture errors and store logs.",
    code: `flowchart TD
App --> Catch[Catch error]
Catch --> Transform[Format log]
Transform --> Store[Send to Log DB]
Store --> Alert[Trigger alert if critical]`,
  },
  {
    id: "f-report",
    name: "Report Generation",
    category: "Data",
    description: "Fetch data -> transform -> export report",
    code: `flowchart TD
Start --> Fetch[Fetch data]
Fetch --> Transform[Clean/format]
Transform --> Generate[Generate PDF]
Generate --> Send[Email report]`,
  },
  {
    id: "f-monitor",
    name: "Monitoring Alerts",
    category: "Ops",
    description: "Detect anomalies and send alerts.",
    code: `flowchart TD
CollectMetrics --> Analyze[Analyze data]
Analyze --> Alert{Threshold exceeded?}
Alert -->|Yes| Notify[Send alert]
Alert -->|No| Continue`,
  },
  {
    id: "f-notify",
    name: "Notification Center",
    category: "UX",
    description: "Aggregate, prioritize, display notifications.",
    code: `flowchart TD
Events --> Aggregate
Aggregate --> Prioritize{Important?}
Prioritize -->|Yes| Push[Show top banner]
Prioritize -->|No| Tray[Send to inbox]`,
  },
  {
    id: "f-chat",
    name: "Chat Message Flow",
    category: "Integration",
    description: "Send -> deliver -> store -> notify.",
    code: `flowchart TD
User --> Send[Send message]
Send --> Server[API Gateway]
Server --> DB[Store message]
Server --> Notify[Send push]
Notify --> Client[Display chat]`,
  },
  {
    id: "f-gateway",
    name: "API Gateway Routing",
    category: "System",
    description: "Dispatch requests to correct microservice.",
    code: `flowchart TD
Request --> Auth[Authenticate]
Auth --> Route[Determine route]
Route -->|User| UserService
Route -->|Order| OrderService
Route -->|Inventory| InventoryService`,
  },
  {
    id: "f-webhook-sub",
    name: "Webhook Subscription",
    category: "Integration",
    description: "Register and verify webhooks.",
    code: `flowchart TD
Client --> Register[POST /subscribe]
Register --> Verify[Send challenge]
Verify --> Confirm{Challenge passed?}
Confirm -->|Yes| Active
Confirm -->|No| Failed`,
  },
  {
    id: "f-feedback",
    name: "User Feedback Handling",
    category: "Process",
    description: "Collect, classify, and take action.",
    code: `flowchart TD
User --> Submit
Submit --> Classify{Type?}
Classify -->|Bug| Ticket
Classify -->|Feature| Roadmap
Classify -->|Praise| Share[Share internally]`,
  },
  {
    id: "f-cdn",
    name: "CDN Caching",
    category: "System",
    description: "Request flow through CDN and origin.",
    code: `flowchart TD
Client --> CDN[Edge cache]
CDN -->|Hit| Serve
CDN -->|Miss| Origin[Fetch from origin]
Origin --> CDN
CDN --> Serve`,
  },
  {
    id: "f-build",
    name: "Frontend Build",
    category: "DevOps",
    description: "Lint -> compile -> bundle -> deploy",
    code: `flowchart TD
Lint --> Compile
Compile --> Bundle
Bundle --> Deploy`,
  },
  {
    id: "f-ai",
    name: "AI Inference Flow",
    category: "Data",
    description: "Input -> preprocess -> predict -> postprocess",
    code: `flowchart TD
Input --> Preprocess
Preprocess --> Model[Run inference]
Model --> Postprocess
Postprocess --> Output`,
  },
  {
    id: "f-analytics",
    name: "Analytics Pipeline",
    category: "Data",
    description: "Events -> Stream -> Warehouse -> Dashboard",
    code: `flowchart TD
Event --> Stream
Stream --> Warehouse
Warehouse --> Dashboard`,
  },
  {
    id: "f-content",
    name: "Content Publishing",
    category: "Process",
    description: "Draft -> review -> approve -> publish",
    code: `flowchart TD
Draft --> Review
Review -->|Approved| Publish
Review -->|Rejected| Edit[Make changes]
Publish --> Done`,
  },
  {
    id: "f-feature-flag",
    name: "Feature Flag Evaluation",
    category: "System",
    description: "Determine feature rollout conditions.",
    code: `flowchart TD
Request --> Evaluate[Check flag]
Evaluate -->|Enabled| Execute[Run feature]
Evaluate -->|Disabled| Skip`,
  },
    {
    id: "f-blockchain-tx2",
    name: "Blockchain Transaction Lifecycle",
    category: "Blockchain",
    description: "Transaction validation and block confirmation process.",
    code: `flowchart TD
User --> CreateTx[Create Transaction]
CreateTx --> Broadcast[Broadcast to network]
Broadcast --> Validate[Nodes validate]
Validate --> Mempool[Added to mempool]
Mempool --> Miner[Picked by miner]
Miner --> Block[Block mined]
Block --> Confirmed[Transaction confirmed]`,
  },
  {
    id: "f-nft-mint",
    name: "NFT Minting Flow",
    category: "Blockchain",
    description: "Minting, metadata storage, and ownership transfer.",
    code: `flowchart TD
Artist --> Upload[Upload artwork]
Upload --> Mint[Mint NFT]
Mint --> Store[Store metadata on IPFS]
Store --> Blockchain[Record on chain]
Blockchain --> Owner[Assign ownership]`,
  },
  {
    id: "f-gaming-level",
    name: "Game Level Progression",
    category: "Gaming",
    description: "Player progression through levels and challenges.",
    code: `flowchart TD
Start --> Play[Start level]
Play --> Challenge{Challenge passed?}
Challenge -->|Yes| Next[Next level]
Challenge -->|No| Retry[Try again]
Next --> Win[Complete game]`,
  },
  {
    id: "f-gaming-reward",
    name: "In-Game Reward System",
    category: "Gaming",
    description: "Player achievements and reward unlocks.",
    code: `flowchart TD
Player --> Action[Complete task]
Action --> Score[Earn points]
Score --> Unlock{Enough points?}
Unlock -->|Yes| Reward[Unlock reward]
Unlock -->|No| Continue[Keep playing]`,
  },
  {
    id: "f-robot-task",
    name: "Robot Task Execution",
    category: "Robotics",
    description: "Robot performing a task with obstacle detection.",
    code: `flowchart TD
Start --> Sense[Sensors collect data]
Sense --> Plan[Path planning]
Plan --> Move[Move to target]
Move --> Detect{Obstacle?}
Detect -->|Yes| Avoid[Avoid obstacle]
Detect -->|No| Complete[Task complete]`,
  },
  {
    id: "f-drone-delivery",
    name: "Drone Delivery Flow",
    category: "Robotics",
    description: "Autonomous drone delivery process.",
    code: `flowchart TD
Order --> Package[Load package]
Package --> Flight[Plan route]
Flight --> Deliver[Deliver package]
Deliver --> Confirm[Confirm receipt]
Confirm --> Return[Return to base]`,
  },
  {
    id: "f-cloud-deploy",
    name: "Cloud Deployment Pipeline",
    category: "Cloud",
    description: "CI/CD pipeline for cloud app deployment.",
    code: `flowchart TD
Commit --> Build[Build container]
Build --> Test[Test code]
Test --> Push[Push to registry]
Push --> Deploy[Deploy to cloud]
Deploy --> Monitor[Monitor logs]`,
  },
  {
    id: "f-cloud-backup",
    name: "Cloud Backup Routine",
    category: "Cloud",
    description: "Daily backup and verification in the cloud.",
    code: `flowchart TD
Schedule --> Snapshot[Create snapshot]
Snapshot --> Upload[Upload to cloud]
Upload --> Verify[Integrity check]
Verify --> Notify[Send report]`,
  },
  {
    id: "f-manufacturing",
    name: "Manufacturing Process",
    category: "Industry",
    description: "Production flow from raw material to finished product.",
    code: `flowchart TD
Raw[Raw materials] --> Assemble[Assembly line]
Assemble --> Inspect[Quality check]
Inspect -->|Pass| Package[Packaging]
Inspect -->|Fail| Rework
Package --> Ship[Shipping]`,
  },
  {
    id: "f-supply-chainn",
    name: "Supply Chain Flow",
    category: "Logistics",
    description: "Procurement to customer delivery.",
    code: `flowchart TD
Supplier --> Warehouse
Warehouse --> Distributor
Distributor --> Retailer
Retailer --> Customer`,
  },
  {
    id: "f-logistics",
    name: "Delivery Logistics Flow",
    category: "Logistics",
    description: "Order tracking and shipment management.",
    code: `flowchart TD
Order --> Pickup[Pickup scheduled]
Pickup --> Transit[In transit]
Transit --> Hub[Sorting hub]
Hub --> Delivery[Out for delivery]
Delivery --> Delivered[Delivered]`,
  },
  {
    id: "f-legal-case",
    name: "Legal Case Process",
    category: "Legal",
    description: "Case filing to judgment.",
    code: `flowchart TD
Client --> File[File case]
File --> Hearing[Hearing scheduled]
Hearing --> Evidence[Present evidence]
Evidence --> Judgment[Final judgment]`,
  },
  {
    id: "f-content-creation",
    name: "Content Creation Workflow",
    category: "Media",
    description: "Create, review, and publish content.",
    code: `flowchart TD
Idea --> Write[Draft content]
Write --> Edit[Edit & proofread]
Edit --> Review[Team review]
Review --> Publish[Publish online]`,
  },
  {
    id: "f-video-production",
    name: "Video Production",
    category: "Media",
    description: "Plan, shoot, edit, and release a video.",
    code: `flowchart TD
Plan --> Shoot[Record footage]
Shoot --> Edit[Edit video]
Edit --> Review[Team review]
Review --> Publish[Release video]`,
  },
  {
    id: "f-agriculture-irrigation",
    name: "Smart Irrigation Flow",
    category: "Agriculture",
    description: "Soil moisture sensing and automated watering.",
    code: `flowchart TD
Sensor --> Analyze[Check moisture]
Analyze --> Decide{Dry soil?}
Decide -->|Yes| Pump[Start water pump]
Decide -->|No| Wait[Standby]`,
  },
  {
    id: "f-harvest-supply",
    name: "Farm-to-Market Supply Chain",
    category: "Agriculture",
    description: "Produce flow from farm to retailer.",
    code: `flowchart TD
Farm --> Transport[Transport goods]
Transport --> Warehouse[Store]
Warehouse --> Market[Distribute to markets]`,
  },
  {
    id: "f-environment",
    name: "Environmental Monitoring",
    category: "Environment",
    description: "Monitor air and water quality through sensors.",
    code: `flowchart TD
Sensor --> Collect[Collect data]
Collect --> Analyze[Analyze results]
Analyze --> Report[Generate report]
Report --> Action[Initiate response]`,
  },
  {
    id: "f-customer-support",
    name: "Customer Support Ticket Flow",
    category: "Customer Service",
    description: "From ticket creation to resolution.",
    code: `flowchart TD
Customer --> Ticket[Create ticket]
Ticket --> Assign[Assign agent]
Assign --> Resolve[Resolve issue]
Resolve --> Close[Close ticket]`,
  },
  {
    id: "f-learning-path",
    name: "Adaptive Learning Path",
    category: "Education",
    description: "AI-powered personalized learning route.",
    code: `flowchart TD
Start --> Assess[Take assessment]
Assess --> Profile[Build learner profile]
Profile --> Recommend[Recommend modules]
Recommend --> Learn[Engage in lessons]
Learn --> Evaluate[Post evaluation]`,
  },
  {
    id: "f-eco-recycling",
    name: "Recycling Workflow",
    category: "Environment",
    description: "Waste sorting and recycling process.",
    code: `flowchart TD
Collect[Collect waste] --> Sort[Sort materials]
Sort --> Process[Recycling plant]
Process --> Reuse[Reuse products]
Reuse --> Dispose[Dispose residue]`,
  },
  // 1️⃣ Healthcare — Patient Diagnosis Flow
  {
    id: "f-diagnosis",
    name: "Patient Diagnosis Flow",
    category: "Healthcare",
    description: "Basic triage and diagnosis process in a clinic.",
    code: `flowchart TD
Patient[Patient Arrives] --> Triage[Initial Assessment]
Triage --> Doctor[Doctor Consultation]
Doctor --> Tests{Tests Needed?}
Tests -->|Yes| Lab[Conduct Lab Tests]
Tests -->|No| Diagnose[Make Diagnosis]
Lab --> Diagnose
Diagnose --> Treatment[Prescribe Treatment]
Treatment --> FollowUp[Schedule Follow-up]`,
  },

  // 2️⃣ Education — Course Enrollment
  {
    id: "f-enrollment",
    name: "Course Enrollment",
    category: "Education",
    description: "Student enrolls, attends, and completes a course.",
    code: `flowchart TD
Apply[Submit Application] --> Review[Application Review]
Review --> Accept{Accepted?}
Accept -->|Yes| Enroll[Enroll in Course]
Accept -->|No| Reject[Notify Rejection]
Enroll --> Attend[Attend Classes]
Attend --> Exam[Take Exam]
Exam -->|Pass| Certify[Get Certificate]
Exam -->|Fail| Retake[Retake Exam]`,
  },

  // 3️⃣ Finance — Loan Approval Flow
  {
    id: "f-loan",
    name: "Loan Approval Process",
    category: "Finance",
    description: "Customer loan approval and disbursement steps.",
    code: `flowchart TD
Apply[Loan Application] --> Verify[Document Verification]
Verify --> Credit[Check Credit Score]
Credit --> Approve{Eligible?}
Approve -->|Yes| Sanction[Sanction Loan]
Approve -->|No| Reject[Reject Application]
Sanction --> Disburse[Disburse Amount]
Disburse --> Monitor[Track Repayment]`,
  },

  // 4️⃣ Manufacturing — Production Line Flow
  {
    id: "f-production",
    name: "Manufacturing Line",
    category: "Manufacturing",
    description: "Production, quality check, and packaging workflow.",
    code: `flowchart TD
Design --> Material[Procure Materials]
Material --> Assemble[Assembly Line]
Assemble --> QC[Quality Check]
QC -->|Pass| Pack[Packaging]
QC -->|Fail| Rework[Rework or Scrap]
Pack --> Ship[Shipping]`,
  },

  // 5️⃣ Marketing — Campaign Lifecycle
  {
    id: "f-marketing",
    name: "Marketing Campaign Lifecycle",
    category: "Marketing",
    description: "From idea creation to campaign analysis.",
    code: `flowchart TD
Idea[Campaign Idea] --> Plan[Create Plan]
Plan --> Design[Design Creatives]
Design --> Launch[Launch Campaign]
Launch --> Monitor[Track Performance]
Monitor --> Report[Analyze Metrics]
Report --> Optimize[Optimize Next Campaign]`,
  },


  // 1️⃣ Artificial Intelligence
  {
    id: "f-ai-pipeline",
    name: "AI Data Pipeline",
    category: "AI",
    description: "Data collection, model training, and deployment.",
    code: `flowchart TD
Collect[Collect Data] --> Clean[Clean Data]
Clean --> Train[Train Model]
Train --> Evaluate[Evaluate Model]
Evaluate -->|Pass| Deploy[Deploy to API]
Evaluate -->|Fail| Tune[Parameter Tuning]`,
  },
  {
    id: "f-ai-monitoring",
    name: "AI Model Monitoring",
    category: "AI",
    description: "Monitor deployed AI models for drift and accuracy.",
    code: `flowchart TD
Request[Prediction Request] --> Model
Model --> Response
Response --> Monitor[Track Accuracy]
Monitor --> Drift{Data Drift?}
Drift -->|Yes| Retrain
Drift -->|No| Continue`,
  },

  // 2️⃣ Cybersecurity
  {
    id: "f-security-incident",
    name: "Incident Response Workflow",
    category: "Cybersecurity",
    description: "Respond to and mitigate security incidents.",
    code: `flowchart TD
Detect[Detect Threat] --> Analyze[Analyze Event]
Analyze --> Contain[Contain Incident]
Contain --> Eradicate[Remove Threat]
Eradicate --> Recover[Restore Systems]
Recover --> Review[Post-Incident Review]`,
  },
  {
    id: "f-firewall-rule",
    name: "Firewall Rule Evaluation",
    category: "Cybersecurity",
    description: "Determine whether a packet is allowed or denied.",
    code: `flowchart TD
Packet[Incoming Packet] --> CheckRules[Check Rule Set]
CheckRules --> Match{Rule Match?}
Match -->|Yes| Action[Allow or Deny]
Match -->|No| Default[Apply Default Policy]`,
  },
  {
    id: "f-access-control",
    name: "Access Control Decision",
    category: "Cybersecurity",
    description: "Evaluate authentication and authorization.",
    code: `flowchart TD
User --> Auth[Authenticate]
Auth --> Token{Valid Token?}
Token -->|Yes| Perms[Check Permissions]
Token -->|No| Deny[Access Denied]
Perms -->|Allowed| Grant[Grant Access]
Perms -->|Denied| Deny`,
  },

  // 3️⃣ Logistics & Supply Chain
  {
    id: "f-logistics2",
    name: "Shipment Tracking Flow",
    category: "Logistics",
    description: "Track shipment through logistics network.",
    code: `flowchart TD
Order --> Pack[Pack Items]
Pack --> Dispatch[Dispatch]
Dispatch --> Transit[In Transit]
Transit --> Deliver[Delivered]`,
  },
  {
    id: "f-warehouse",
    name: "Warehouse Inventory Flow",
    category: "Logistics",
    description: "Receiving, stocking, and dispatching goods.",
    code: `flowchart TD
Receive[Receive Goods] --> Inspect[Inspect Items]
Inspect --> Store[Store in Inventory]
Store --> Pick[Pick for Order]
Pick --> Dispatch`,
  },
  {
    id: "f-return",
    name: "Return Merchandise Authorization (RMA)",
    category: "Logistics",
    description: "Process customer returns and restocking.",
    code: `flowchart TD
Customer --> Request[Return Request]
Request --> Approve{Approved?}
Approve -->|Yes| ShipBack[Ship Item]
ShipBack --> Inspect[Inspect Condition]
Inspect --> Refund[Issue Refund]
Approve -->|No| Deny[Reject Return]`,
  },

  // 4️⃣ Legal / Compliance
  {
    id: "f-contract-review",
    name: "Contract Review Process",
    category: "Legal",
    description: "Draft, review, approve, and sign contracts.",
    code: `flowchart TD
Draft --> Review[Legal Review]
Review --> Approve{Approved?}
Approve -->|Yes| Sign[Sign Contract]
Approve -->|No| Revise[Send Revisions]`,
  },
  {
    id: "f-compliance",
    name: "Compliance Audit",
    category: "Legal",
    description: "Internal audit for regulatory compliance.",
    code: `flowchart TD
Plan --> Assess[Assess Risk Areas]
Assess --> Audit[Conduct Audit]
Audit --> Report[Report Findings]
Report --> Fix[Implement Remediation]`,
  },

  // 5️⃣ HR / Recruiting
  {
    id: "f-hiring",
    name: "Hiring Workflow",
    category: "HR",
    description: "Job posting to onboarding process.",
    code: `flowchart TD
Post[Post Job] --> Screen[Screen Applicants]
Screen --> Interview[Conduct Interview]
Interview --> Offer{Offer Accepted?}
Offer -->|Yes| Onboard
Offer -->|No| NextCandidate`,
  },
  {
    id: "f-performance",
    name: "Performance Review",
    category: "HR",
    description: "Employee performance evaluation flow.",
    code: `flowchart TD
Start[Start Review] --> SelfEval[Self Evaluation]
SelfEval --> ManagerEval[Manager Review]
ManagerEval --> Meeting[Feedback Meeting]
Meeting --> Record[Record Rating]`,
  },
  {
    id: "f-training",
    name: "Employee Training Flow",
    category: "HR",
    description: "Assign, complete, and verify employee training.",
    code: `flowchart TD
Assign[Assign Training] --> Attend[Attend Session]
Attend --> Complete{Completed?}
Complete -->|Yes| Certify[Certify Employee]
Complete -->|No| Reminder[Send Reminder]`,
  },

  // 6️⃣ Energy / Environment
  {
    id: "f-energy-grid",
    name: "Energy Distribution Grid",
    category: "Energy",
    description: "Power generation, transmission, and distribution.",
    code: `flowchart TD
Plant[Power Plant] --> Transmission
Transmission --> Substation
Substation --> Consumer`,
  },
  {
    id: "f-solar",
    name: "Solar Power Generation",
    category: "Energy",
    description: "Convert sunlight to usable electricity.",
    code: `flowchart TD
Sun --> Panel[Solar Panel]
Panel --> Inverter[DC to AC]
Inverter --> Battery[Store Energy]
Battery --> Grid[Feed to Grid]`,
  },
  {
    id: "f-water-cycle",
    name: "Water Treatment Process",
    category: "Environment",
    description: "Clean water production process.",
    code: `flowchart TD
Source --> Filter[Filtration]
Filter --> Treat[Treatment Plant]
Treat --> Distribute[Distribution Network]`,
  },

  // 7️⃣ Agriculture
  {
    id: "f-farm-irrigation",
    name: "Irrigation System Flow",
    category: "Agriculture",
    description: "Automated irrigation control system.",
    code: `flowchart TD
Sensor[Moisture Sensor] --> Controller
Controller --> Pump[Start Pump]
Pump --> Field[Water Plants]
Field --> Sensor`,
  },
  {
    id: "f-harvest",
    name: "Harvest Cycle",
    category: "Agriculture",
    description: "Crop planting to harvesting.",
    code: `flowchart TD
Plant --> Grow[Growth Stage]
Grow --> Monitor[Monitor Health]
Monitor --> Harvest[Harvest Crops]`,
  },
  {
    id: "f-livestock",
    name: "Livestock Management",
    category: "Agriculture",
    description: "Feed, monitor, and process livestock.",
    code: `flowchart TD
Feed --> HealthCheck[Check Health]
HealthCheck --> Record[Update Database]
Record --> Sell[Market Livestock]`,
  },

  // 8️⃣ Customer Support
  {
    id: "f-ticket-escalation",
    name: "Ticket Escalation Process",
    category: "Support",
    description: "Escalate tickets based on severity.",
    code: `flowchart TD
Customer --> Support[Support Agent]
Support --> Resolve{Resolved?}
Resolve -->|Yes| Close
Resolve -->|No| Escalate[Tier 2 Support]`,
  },
  {
    id: "f-feedback-loop",
    name: "Customer Feedback Flow",
    category: "Support",
    description: "Collect, analyze, and improve service.",
    code: `flowchart TD
Collect[Collect Feedback] --> Analyze
Analyze --> Report
Report --> Improve[Implement Improvements]`,
  },

  // 9️⃣ Real Estate
  {
    id: "f-property-sale",
    name: "Property Sale Process",
    category: "Real Estate",
    description: "Listing to deal closure.",
    code: `flowchart TD
List[List Property] --> Visit[Schedule Visit]
Visit --> Offer[Receive Offer]
Offer --> Deal{Deal Closed?}
Deal -->|Yes| Transfer[Transfer Ownership]
Deal -->|No| Negotiate[Negotiate Terms]`,
  },
  {
    id: "f-rental",
    name: "Rental Agreement Flow",
    category: "Real Estate",
    description: "Tenant screening and lease signing.",
    code: `flowchart TD
Tenant --> Apply
Apply --> Verify[Background Check]
Verify --> Approve{Approved?}
Approve -->|Yes| Lease[Sign Lease]
Approve -->|No| Reject`,
  },

  // 🔟 Transportation
  {
    id: "f-bus-route",
    name: "Public Bus Operation",
    category: "Transport",
    description: "Route scheduling and tracking.",
    code: `flowchart TD
Depot --> Schedule
Schedule --> Route[Active Route]
Route --> Stop[Passenger Stops]
Stop --> Depot[Return to Depot]`,
  },
  {
    id: "f-flight",
    name: "Flight Operation Flow",
    category: "Transport",
    description: "From boarding to landing.",
    code: `flowchart TD
Boarding --> Taxi[Taxi to runway]
Taxi --> Takeoff
Takeoff --> Cruise
Cruise --> Land[Landing]
Land --> Disembark`,
  },


  // 1. Finance & Accounting
  {
    id: "f-invoice",
    name: "Invoice Processing",
    category: "Finance",
    description: "Approval and payment flow for invoices.",
    code: `flowchart TD
Vendor --> Submit[Submit invoice]
Submit --> Review[Finance review]
Review --> Approve{Approved?}
Approve -->|Yes| Pay[Process payment]
Approve -->|No| Reject[Reject invoice]`,
  },
  {
    id: "f-expense",
    name: "Expense Reimbursement",
    category: "Finance",
    description: "Employee expense claim approval process.",
    code: `flowchart TD
Employee --> SubmitClaim
SubmitClaim --> ManagerReview
ManagerReview --> HRCheck{Valid receipts?}
HRCheck -->|Yes| Pay[Reimburse]
HRCheck -->|No| Return[Return claim]`,
  },
  {
    id: "f-budget",
    name: "Budget Approval",
    category: "Finance",
    description: "Prepare, review, and approve budgets.",
    code: `flowchart TD
Dept --> Prepare[Prepare budget]
Prepare --> Review[Review by finance]
Review --> Approve{Approve?}
Approve -->|Yes| Allocate[Allocate funds]
Approve -->|No| Revise[Request revision]`,
  },
  {
    id: "f-loan2",
    name: "Loan Approval Process",
    category: "Finance",
    description: "From loan application to disbursement.",
    code: `flowchart TD
Customer --> Apply[Submit application]
Apply --> Verify[Verify documents]
Verify --> Approve{Credit approved?}
Approve -->|Yes| Disburse[Disburse funds]
Approve -->|No| Reject[Reject application]`,
  },
  {
    id: "f-audit",
    name: "Financial Audit",
    category: "Finance",
    description: "Audit workflow for financial records.",
    code: `flowchart TD
Plan[Plan audit] --> Collect[Collect records]
Collect --> Review[Examine data]
Review --> Report[Generate audit report]
Report --> Close[Close audit]`,
  },

  // 2. IoT / Hardware
  {
    id: "f-iot-sensor",
    name: "IoT Sensor Data Flow",
    category: "IoT",
    description: "Sensor data collection and processing.",
    code: `flowchart TD
Sensor --> Gateway[Gateway node]
Gateway --> Cloud[Send to cloud]
Cloud --> Process[Process data]
Process --> Dashboard[Display results]`,
  },
  {
    id: "f-iot-alert2",
    name: "IoT Alert System",
    category: "IoT",
    description: "Trigger alerts from sensor thresholds.",
    code: `flowchart TD
ReadSensor[Read data] --> Compare{Exceeds threshold?}
Compare -->|Yes| Alert[Send alert]
Compare -->|No| Continue[Continue monitoring]`,
  },
  {
    id: "f-iot-maintenance",
    name: "Predictive Maintenance",
    category: "IoT",
    description: "Monitor equipment health to prevent failure.",
    code: `flowchart TD
Machine --> Collect[Collect vibration data]
Collect --> Analyze[Analyze trends]
Analyze --> Predict{Failure likely?}
Predict -->|Yes| Notify[Schedule maintenance]
Predict -->|No| Continue[Continue monitoring]`,
  },

  // 3. Education
  {
    id: "f-student-admission",
    name: "Student Admission Flow",
    category: "Education",
    description: "Application, review, and enrollment process.",
    code: `flowchart TD
Applicant --> Submit[Submit application]
Submit --> Review[Faculty review]
Review --> Decision{Accepted?}
Decision -->|Yes| Enroll[Enroll student]
Decision -->|No| Reject[Reject application]`,
  },
  {
    id: "f-exam-grading",
    name: "Exam Grading Process",
    category: "Education",
    description: "Evaluation and result publishing.",
    code: `flowchart TD
Exam --> Collect[Collect answer sheets]
Collect --> Grade[Grade papers]
Grade --> Verify[Quality check]
Verify --> Publish[Publish results]`,
  },
  {
    id: "f-course-design",
    name: "Course Design",
    category: "Education",
    description: "Design and approve a new course.",
    code: `flowchart TD
Idea --> Draft[Draft syllabus]
Draft --> Review[Faculty review]
Review --> Approve{Approve course?}
Approve -->|Yes| Launch[Launch course]
Approve -->|No| Revise[Make changes]`,
  },

  // 4. Healthcare
  {
    id: "f-patient-intake",
    name: "Patient Intake Flow",
    category: "Healthcare",
    description: "From registration to doctor assignment.",
    code: `flowchart TD
Patient --> Register[Register patient]
Register --> Triage[Assess urgency]
Triage --> Assign[Assign doctor]
Assign --> Consult[Consultation]`,
  },
  {
    id: "f-lab-test",
    name: "Lab Test Processing",
    category: "Healthcare",
    description: "Request, test, and report flow.",
    code: `flowchart TD
Doctor --> Request[Test order]
Request --> Lab[Perform test]
Lab --> Validate[Validate results]
Validate --> Report[Send report to doctor]`,
  },
  {
    id: "f-surgery",
    name: "Surgery Scheduling",
    category: "Healthcare",
    description: "Schedule and perform surgical procedures.",
    code: `flowchart TD
Patient --> Evaluate[Pre-op evaluation]
Evaluate --> Schedule[Schedule surgery]
Schedule --> Operate[Perform surgery]
Operate --> Recover[Monitor recovery]`,
  },
  {
    id: "f-vaccine",
    name: "Vaccination Flow",
    category: "Healthcare",
    description: "From registration to immunization record.",
    code: `flowchart TD
Register --> Screen[Medical screening]
Screen --> Vaccinate[Administer dose]
Vaccinate --> Record[Update records]`,
  },

  // 5. SaaS / Cloud
  {
    id: "f-saas-deploy",
    name: "SaaS Deployment Pipeline",
    category: "Cloud",
    description: "Continuous integration and deployment.",
    code: `flowchart TD
Commit --> Build
Build --> Test
Test --> Deploy
Deploy --> Monitor`,
  },
  {
    id: "f-saas-billing",
    name: "Subscription Billing Flow",
    category: "SaaS",
    description: "Customer subscription billing system.",
    code: `flowchart TD
User --> Subscribe[Choose plan]
Subscribe --> Pay[Process payment]
Pay --> Activate[Activate subscription]
Activate --> Invoice[Generate invoice]`,
  },
  {
    id: "f-saas-backup",
    name: "Cloud Backup Flow",
    category: "Cloud",
    description: "Backup and restore process for SaaS.",
    code: `flowchart TD
Schedule --> Backup[Take snapshot]
Backup --> Store[Upload to storage]
Store --> Verify[Integrity check]
Verify --> Ready[Ready for restore]`,
  },

  // 6. Manufacturing
  {
    id: "f-manufacture-assembly",
    name: "Assembly Line Process",
    category: "Manufacturing",
    description: "Product moves through production stages.",
    code: `flowchart TD
Raw[Raw materials] --> Assemble[Assembly]
Assemble --> Inspect[Inspection]
Inspect --> Pack[Packaging]
Pack --> Ship[Shipment]`,
  },
  {
    id: "f-quality-check",
    name: "Quality Control",
    category: "Manufacturing",
    description: "Inspect and reject defective products.",
    code: `flowchart TD
Product --> Inspect[Visual inspection]
Inspect --> Pass{Pass QC?}
Pass -->|Yes| Approve
Pass -->|No| Reject[Reject product]`,
  },
  {
    id: "f-supply-chain",
    name: "Supply Chain Management",
    category: "Manufacturing",
    description: "Procure, transport, and deliver materials.",
    code: `flowchart TD
Procure --> Transport
Transport --> Store
Store --> Distribute`,
  },

  // 7. Marketing
  {
    id: "f-campaign",
    name: "Marketing Campaign Flow",
    category: "Marketing",
    description: "Plan, execute, and analyze a campaign.",
    code: `flowchart TD
Plan --> Launch
Launch --> CollectData
CollectData --> Analyze
Analyze --> Optimize`,
  },
  {
    id: "f-lead-nurture",
    name: "Lead Nurturing Flow",
    category: "Marketing",
    description: "Move leads through the sales funnel.",
    code: `flowchart TD
Lead --> Engage[Email follow-up]
Engage --> Qualify{Interested?}
Qualify -->|Yes| Sales[Send to sales]
Qualify -->|No| Retarget`,
  },
  {
    id: "f-social-post",
    name: "Social Media Approval",
    category: "Marketing",
    description: "Content scheduling and approval.",
    code: `flowchart TD
Draft --> Review
Review --> Approve{Approved?}
Approve -->|Yes| Schedule
Approve -->|No| Revise`,
  },

  // 8. Networking / DevOps
  {
    id: "f-network-deploy",
    name: "Network Deployment",
    category: "Networking",
    description: "Deploy and validate a new network setup.",
    code: `flowchart TD
Design --> Configure
Configure --> Test
Test --> Deploy
Deploy --> Monitor`,
  },
  {
    id: "f-backup-recovery",
    name: "Disaster Recovery Plan",
    category: "Networking",
    description: "Backup and restore systems post-failure.",
    code: `flowchart TD
Backup --> Fail[System failure]
Fail --> Restore[Restore backup]
Restore --> Verify[Verify data]`,
  },
  {
    id: "f-load-balancer",
    name: "Load Balancer Flow",
    category: "Networking",
    description: "Distribute network traffic efficiently.",
    code: `flowchart TD
Client --> LB[Load Balancer]
LB --> Server1
LB --> Server2
LB --> HealthCheck[Monitor servers]`,
  },


  // 1. Legal / Compliance
  {
    id: "f-legal-contract",
    name: "Contract Review Process",
    category: "Legal",
    description: "Draft, review, and finalize contracts.",
    code: `flowchart TD
Draft[Draft contract] --> Review[Legal review]
Review --> Revise{Revisions needed?}
Revise -->|Yes| Draft
Revise -->|No| Approve[Approve contract]
Approve --> Sign[Sign agreement]`,
  },
  {
    id: "f-legal-dispute",
    name: "Dispute Resolution",
    category: "Legal",
    description: "Resolve disputes through mediation or court.",
    code: `flowchart TD
Issue[Dispute arises] --> Mediate[Mediation attempt]
Mediate --> Success{Resolved?}
Success -->|Yes| Close[Case closed]
Success -->|No| Court[Proceed to court]`,
  },

  // 2. Gaming
  {
    id: "f-game-loop",
    name: "Game Loop Cycle",
    category: "Gaming",
    description: "Core loop of a game’s rendering cycle.",
    code: `flowchart TD
Start --> Input[Player input]
Input --> Update[Update game state]
Update --> Render[Render frame]
Render --> Check[Exit?]
Check -->|No| Input
Check -->|Yes| End`,
  },
  {
    id: "f-game-ai",
    name: "Game AI Decision",
    category: "Gaming",
    description: "AI logic for in-game NPC behavior.",
    code: `flowchart TD
NPC[AI Character] --> Detect[Detect player]
Detect --> Attack{Enemy nearby?}
Attack -->|Yes| Fight[Attack player]
Attack -->|No| Patrol[Patrol area]`,
  },

  // 3. Robotics
  {
    id: "f-robot-nav",
    name: "Robot Navigation Flow",
    category: "Robotics",
    description: "Robot pathfinding and obstacle avoidance.",
    code: `flowchart TD
Start --> Sense[Sensors detect environment]
Sense --> Plan[Plan path]
Plan --> Move[Move robot]
Move --> Avoid{Obstacle ahead?}
Avoid -->|Yes| Replan[Recalculate path]
Avoid -->|No| Continue[Keep moving]`,
  },
  {
    id: "f-robot-task2",
    name: "Task Execution Robot",
    category: "Robotics",
    description: "Sequence for executing automated tasks.",
    code: `flowchart TD
Idle --> Receive[Receive task]
Receive --> Execute[Perform task]
Execute --> Verify[Verify completion]
Verify -->|Success| Done
Verify -->|Fail| Retry[Retry task]`,
  },

  // 4. Research & Academia
  {
    id: "f-research-paper",
    name: "Research Paper Lifecycle",
    category: "Research",
    description: "From idea to publication.",
    code: `flowchart TD
Idea --> Literature[Review literature]
Literature --> Experiment[Conduct experiment]
Experiment --> Analyze[Analyze data]
Analyze --> Write[Write paper]
Write --> Submit[Submit to journal]
Submit --> Review{Accepted?}
Review -->|Yes| Publish[Publish paper]
Review -->|No| Revise[Revise & resubmit]`,
  },
  {
    id: "f-research-grant",
    name: "Grant Application",
    category: "Research",
    description: "Academic grant application process.",
    code: `flowchart TD
Concept --> Proposal[Write proposal]
Proposal --> Submit[Submit to funding agency]
Submit --> Review[Peer review]
Review --> Decision{Approved?}
Decision -->|Yes| Fund[Receive funding]
Decision -->|No| Revise[Revise proposal]`,
  },

  // 5. Blockchain / Web3
  {
    id: "f-blockchain-tx",
    name: "Blockchain Transaction Flow",
    category: "Blockchain",
    description: "Transaction validation and block inclusion.",
    code: `flowchart TD
User --> CreateTx[Create transaction]
CreateTx --> Broadcast[Broadcast to network]
Broadcast --> Validate[Validate by nodes]
Validate --> Block{Valid?}
Block -->|Yes| Mine[Add to block]
Block -->|No| Reject[Reject TX]`,
  },
  {
    id: "f-blockchain-mining",
    name: "Mining Process",
    category: "Blockchain",
    description: "Block creation and consensus.",
    code: `flowchart TD
PendingTx[Pending TXs] --> Select[Select valid TXs]
Select --> Hash[Compute hash]
Hash --> Check{Hash < Target?}
Check -->|Yes| Broadcast[Broadcast block]
Check -->|No| Retry[Increment nonce]`,
  },

  // 6. API & Integration
  {
    id: "f-api-version",
    name: "API Versioning Flow",
    category: "API",
    description: "Manage and deprecate API versions safely.",
    code: `flowchart TD
Develop --> Release[Release v1]
Release --> Monitor[Monitor usage]
Monitor --> Deprecate[Announce deprecation]
Deprecate --> Sunset[Disable v1]
Sunset --> Replace[Promote v2]`,
  },
  {
    id: "f-api-error",
    name: "API Error Handling",
    category: "API",
    description: "Handle 4xx and 5xx errors gracefully.",
    code: `flowchart TD
Client --> Request
Request --> Server
Server --> Check{Valid input?}
Check -->|No| Error[Return 400]
Check -->|Yes| Process[Process request]
Process --> Fail{Server error?}
Fail -->|Yes| Retry[Return 500]
Fail -->|No| Success[Return 200]`,
  },

  // 7. Customer Support
  {
    id: "f-support-escalation",
    name: "Support Escalation Flow",
    category: "Support",
    description: "Tiered support ticket escalation system.",
    code: `flowchart TD
Ticket --> Tier1[Level 1 Support]
Tier1 --> Resolve{Resolved?}
Resolve -->|Yes| Close
Resolve -->|No| Tier2[Escalate to Level 2]
Tier2 --> Tier3[Escalate to Level 3]
Tier3 --> Close`,
  },
  {
    id: "f-support-feedback",
    name: "Customer Feedback Loop",
    category: "Support",
    description: "Gather customer satisfaction feedback.",
    code: `flowchart TD
Service --> Request[Send feedback form]
Request --> Receive[Receive response]
Receive --> Analyze[Analyze feedback]
Analyze --> Action[Implement improvements]`,
  },

  // 8. UX / Product Design
  {
    id: "f-ux-prototype",
    name: "UX Prototype Flow",
    category: "UX",
    description: "Design, test, and refine product prototypes.",
    code: `flowchart TD
Idea --> Sketch[Create wireframes]
Sketch --> Prototype[Build prototype]
Prototype --> Test[Test with users]
Test --> Iterate{Changes needed?}
Iterate -->|Yes| Sketch
Iterate -->|No| Final[Finalize design]`,
  },
  {
    id: "f-ux-journey",
    name: "User Journey Mapping",
    category: "UX",
    description: "Visualize user experience through stages.",
    code: `flowchart TD
Awareness --> Consideration
Consideration --> Purchase
Purchase --> Use
Use --> Support
Support --> Loyalty`,
  },

  // 9. HR Performance
  {
    id: "f-hr-review",
    name: "Performance Review Cycle",
    category: "HR",
    description: "Performance evaluation and feedback loop.",
    code: `flowchart TD
Employee --> SelfEval[Self evaluation]
SelfEval --> ManagerEval[Manager review]
ManagerEval --> Meeting[Feedback meeting]
Meeting --> Finalize[Finalize rating]
Finalize --> Archive[Store records]`,
  },
  {
    id: "f-hr-exit",
    name: "Employee Exit Flow",
    category: "HR",
    description: "Formal exit process for employees.",
    code: `flowchart TD
Resign[Submit resignation] --> Notice[Notice period]
Notice --> Handover[Handover tasks]
Handover --> ExitInterview[Exit interview]
ExitInterview --> Clearances[HR clearance]
Clearances --> FinalPay[Final settlement]`,
  },

  // 10. Logistics / Supply Chain
  {
    id: "f-logistics-shipment",
    name: "Shipment Tracking",
    category: "Logistics",
    description: "Track shipment from origin to delivery.",
    code: `flowchart TD
Warehouse --> Dispatch
Dispatch --> InTransit
InTransit --> OutForDelivery
OutForDelivery --> Delivered
Delivered --> Feedback`,
  },
  {
    id: "f-logistics-inventory",
    name: "Inventory Restock",
    category: "Logistics",
    description: "Reorder inventory when below threshold.",
    code: `flowchart TD
CheckStock --> Low{Below threshold?}
Low -->|Yes| Order[Place order]
Low -->|No| Continue
Order --> Receive[Receive shipment]
Receive --> Update[Update stock levels]`,
  },

  // 11. CRM / Customer Success
  {
    id: "f-crm-onboarding",
    name: "Customer Onboarding",
    category: "CRM",
    description: "Welcome and educate new customers.",
    code: `flowchart TD
Signup --> Welcome[Welcome email]
Welcome --> Demo[Product demo]
Demo --> Followup[Follow-up call]
Followup --> Success[Customer activated]`,
  },
  {
    id: "f-crm-renewal",
    name: "Subscription Renewal Flow",
    category: "CRM",
    description: "Automated renewal and payment retry process.",
    code: `flowchart TD
Expiry[Subscription expiring] --> Notify[Send renewal reminder]
Notify --> Pay{Payment received?}
Pay -->|Yes| Renew[Extend subscription]
Pay -->|No| Retry[Retry payment]`,
  },

  // 12. Content / Media
  {
    id: "f-media-production",
    name: "Video Production Pipeline",
    category: "Media",
    description: "Plan, shoot, edit, and publish video content.",
    code: `flowchart TD
Concept --> Script
Script --> Shoot
Shoot --> Edit
Edit --> Review
Review --> Publish`,
  },
  {
    id: "f-content-approval",
    name: "Content Approval Workflow",
    category: "Media",
    description: "Multi-stage review and publish flow.",
    code: `flowchart TD
Writer --> Editor[Editorial review]
Editor --> Legal[Legal review]
Legal --> Approve{Approved?}
Approve -->|Yes| Publish
Approve -->|No| Revise[Request changes]`,
  },



  // 1. Artificial Intelligence
  {
    id: "f-ai-training",
    name: "AI Model Training Flow",
    category: "AI",
    description: "Prepare dataset, train, evaluate, and deploy ML models.",
    code: `flowchart TD
Data[Collect Data] --> Clean[Clean Data]
Clean --> Split[Split into Train/Test]
Split --> Train[Train Model]
Train --> Eval{Accuracy OK?}
Eval -->|Yes| Deploy[Deploy Model]
Eval -->|No| Tune[Hyperparameter Tuning] --> Train`,
  },
  {
    id: "f-ai-inference",
    name: "AI Inference Request",
    category: "AI",
    description: "Model receives input and returns predictions.",
    code: `flowchart TD
User --> Request[Send Input]
Request --> Model[Run Inference]
Model --> Output[Generate Prediction]
Output --> Return[Return Result]`,
  },
  {
    id: "f-ai-feedback-loop",
    name: "AI Feedback Loop",
    category: "AI",
    description: "Collect user feedback to improve models.",
    code: `flowchart TD
User --> Prediction
Prediction --> Feedback[Collect feedback]
Feedback --> Analyze[Analyze data]
Analyze --> Retrain[Retrain model]
Retrain --> Deploy[Deploy new version]`,
  },

  // 2. Internet of Things
  {
    id: "f-iot-sensor2",
    name: "IoT Sensor Data Flow",
    category: "IoT",
    description: "Collect, transmit, and analyze IoT sensor data.",
    code: `flowchart TD
Sensor --> Gateway[Send data]
Gateway --> Cloud[Upload to cloud]
Cloud --> Analyze[Analyze data]
Analyze --> Dashboard[Display results]`,
  },
  {
    id: "f-iot-alert",
    name: "IoT Alert System",
    category: "IoT",
    description: "Threshold-based alert notification system.",
    code: `flowchart TD
Sensor --> Read[Measure value]
Read --> Check{Exceeds threshold?}
Check -->|Yes| Alert[Send alert]
Check -->|No| Log[Record data]`,
  },

  // 3. Cybersecurity
  {
    id: "f-cyber-threat",
    name: "Threat Detection",
    category: "Security",
    description: "Monitor network and detect potential threats.",
    code: `flowchart TD
Logs --> Analyze[Analyze activity]
Analyze --> Detect{Suspicious?}
Detect -->|Yes| Alert[Trigger alert]
Detect -->|No| Continue[Continue monitoring]`,
  },
  {
    id: "f-cyber-response",
    name: "Incident Response Flow",
    category: "Security",
    description: "Identify, contain, and resolve cyber incidents.",
    code: `flowchart TD
Detect[Detect Incident] --> Identify[Identify Scope]
Identify --> Contain[Contain Threat]
Contain --> Eradicate[Remove Malware]
Eradicate --> Recover[Restore Systems]
Recover --> Review[Post-incident review]`,
  },

  // 4. Finance
  {
    id: "f-finance-approval",
    name: "Loan Approval Process",
    category: "Finance",
    description: "Loan verification and approval pipeline.",
    code: `flowchart TD
Applicant --> Submit[Submit application]
Submit --> Verify[Verify documents]
Verify --> CreditCheck[Check credit score]
CreditCheck --> Decision{Approved?}
Decision -->|Yes| Approve[Approve Loan]
Decision -->|No| Reject[Reject Application]`,
  },
  {
    id: "f-finance-payment",
    name: "Online Payment Gateway",
    category: "Finance",
    description: "Flow for online card payment processing.",
    code: `flowchart TD
User --> Gateway[Enter card details]
Gateway --> Validate{Card valid?}
Validate -->|Yes| Bank[Request authorization]
Bank --> Response{Approved?}
Response -->|Yes| Success[Payment successful]
Response -->|No| Fail[Payment declined]`,
  },

  // 5. HR / Hiring
  {
    id: "f-hr-hiring",
    name: "Hiring Workflow",
    category: "HR",
    description: "End-to-end recruitment process.",
    code: `flowchart TD
JobPost --> Apply[Applications received]
Apply --> Screen[Initial screening]
Screen --> Interview[Interview]
Interview --> Offer{Selected?}
Offer -->|Yes| Hire[Send offer letter]
Offer -->|No| Reject[Notify rejection]`,
  },
  {
    id: "f-hr-onboarding",
    name: "Employee Onboarding",
    category: "HR",
    description: "Steps for onboarding a new employee.",
    code: `flowchart TD
Hire --> Docs[Collect documents]
Docs --> Setup[System setup]
Setup --> Orientation[Orientation session]
Orientation --> Assign[Assign mentor]`,
  },

  // 6. Marketing
  {
    id: "f-marketing-campaign",
    name: "Marketing Campaign Flow",
    category: "Marketing",
    description: "Campaign planning, execution, and review.",
    code: `flowchart TD
Idea --> Plan[Plan campaign]
Plan --> Execute[Run ads]
Execute --> Track[Track metrics]
Track --> Optimize[Optimize results]
Optimize --> Report[Report insights]`,
  },
  {
    id: "f-seo-strategy",
    name: "SEO Optimization Flow",
    category: "Marketing",
    description: "SEO improvement and ranking strategy.",
    code: `flowchart TD
Audit --> Research[Keyword research]
Research --> Optimize[Optimize pages]
Optimize --> Monitor[Track rankings]
Monitor --> Update[Continuous updates]`,
  },

  // 7. Networking
  {
    id: "f-network-packet",
    name: "Packet Transmission Flow",
    category: "Networking",
    description: "Packet flow in a computer network.",
    code: `flowchart TD
App[Application Layer] --> Transport
Transport --> Network
Network --> DataLink
DataLink --> Physical
Physical --> Transmission[Data sent]`,
  },
  {
    id: "f-network-dns",
    name: "DNS Resolution",
    category: "Networking",
    description: "Resolve domain name to IP address.",
    code: `flowchart TD
Browser --> Cache[Check local cache]
Cache -->|Miss| Resolver[Contact DNS resolver]
Resolver --> Root[Root server]
Root --> TLD[TLD server]
TLD --> Authoritative[Authoritative DNS]
Authoritative --> Return[Return IP address]`,
  },

  // 8. Healthcare
  {
    id: "f-healthcare-diagnosis",
    name: "Patient Diagnosis Flow",
    category: "Healthcare",
    description: "Patient visit to diagnosis and treatment.",
    code: `flowchart TD
Patient --> Register[Register]
Register --> Consult[Consult doctor]
Consult --> Tests[Request tests]
Tests --> Diagnose[Diagnosis]
Diagnose --> Treat[Treatment given]`,
  },
  {
    id: "f-healthcare-lab",
    name: "Lab Test Workflow",
    category: "Healthcare",
    description: "Sample collection, analysis, and reporting.",
    code: `flowchart TD
Sample --> Label[Label sample]
Label --> Analyze[Analyze in lab]
Analyze --> Verify[Verify results]
Verify --> Report[Generate report]`,
  },

  // 9. Education
  {
    id: "f-education-course",
    name: "Online Course Enrollment",
    category: "Education",
    description: "Student enrolls and completes a course.",
    code: `flowchart TD
Student --> Browse[Browse courses]
Browse --> Enroll[Enroll in course]
Enroll --> Study[Attend lectures]
Study --> Test[Complete assessments]
Test --> Certificate[Get certificate]`,
  },

  // 10. Manufacturing / Process Control
  {
    id: "f-assembly-line",
    name: "Assembly Line Flow",
    category: "Manufacturing",
    description: "Factory assembly workflow.",
    code: `flowchart TD
Start --> Assemble[Assemble parts]
Assemble --> Test[Test quality]
Test -->|Pass| Package
Test -->|Fail| Rework`,
  },
  {
    id: "f-quality-control",
    name: "Quality Control Process",
    category: "Manufacturing",
    description: "Detect defects and ensure product standards.",
    code: `flowchart TD
RawMaterial --> Inspect[Inspect materials]
Inspect --> Approve{Meets quality?}
Approve -->|Yes| Continue
Approve -->|No| Reject[Reject batch]`,
  },

  // 11. Cloud / DevOps
  {
    id: "f-devops-monitor",
    name: "Cloud Monitoring Pipeline",
    category: "DevOps",
    description: "Monitor and alert system for infrastructure.",
    code: `flowchart TD
Metrics --> Collect[Collect data]
Collect --> Analyze[Analyze patterns]
Analyze --> Alert{Threshold exceeded?}
Alert -->|Yes| Notify[Send alert]
Alert -->|No| Log[Log metrics]`,
  },
  {
    id: "f-devops-auto-scale",
    name: "Auto-Scaling Workflow",
    category: "DevOps",
    description: "Scale up/down cloud servers based on load.",
    code: `flowchart TD
Monitor --> Detect[Check CPU load]
Detect --> Decision{Load high?}
Decision -->|Yes| ScaleUp[Add servers]
Decision -->|No| ScaleDown[Remove servers]`,
  },

  // 12. Environment / Sustainability
  {
    id: "f-solar-energy",
    name: "Solar Energy Production",
    category: "Environment",
    description: "Solar panel energy conversion and storage.",
    code: `flowchart TD
Sun --> Panel[Capture energy]
Panel --> Convert[Convert to electricity]
Convert --> Store[Store in battery]
Store --> Use[Power devices]`,
  },
  {
    id: "f-waste-management",
    name: "Waste Management Process",
    category: "Environment",
    description: "Segregate, process, and dispose waste safely.",
    code: `flowchart TD
Collect --> Sort[Segregate waste]
Sort --> Process[Compost/Recycle]
Process --> Dispose[Safe disposal]`,
  },

  // 13. Project Management
  {
    id: "f-project-plan",
    name: "Project Lifecycle",
    category: "Management",
    description: "Plan, execute, and close project phases.",
    code: `flowchart TD
Initiate --> Plan
Plan --> Execute
Execute --> Monitor
Monitor --> Close`,
  },
  {
    id: "f-sprint-agile",
    name: "Agile Sprint Cycle",
    category: "Management",
    description: "Agile sprint planning and delivery.",
    code: `flowchart TD
Backlog --> SprintPlan[Plan sprint]
SprintPlan --> Dev[Develop tasks]
Dev --> Review[Review & test]
Review --> Release[Release increment]`,
  },

  // 14. Data / BI
  {
    id: "f-data-warehouse",
    name: "Data Warehouse ETL",
    category: "Data",
    description: "Extract, transform, and load process.",
    code: `flowchart TD
Source --> Extract
Extract --> Transform
Transform --> Load
Load --> Warehouse[Data warehouse]`,
  },
  {
    id: "f-dashboard-update",
    name: "BI Dashboard Update",
    category: "Data",
    description: "Automated dashboard refresh pipeline.",
    code: `flowchart TD
DataSource --> ETL
ETL --> Model[Data model]
Model --> Render[Render dashboard]
Render --> Notify[Notify users]`,
  },


  {
    id: "f-ai-chatbot",
    name: "AI Chatbot Interaction",
    category: "AI",
    description: "Handle user input, intent recognition, and response generation.",
    code: `flowchart TD
User --> Input[User message]
Input --> NLP[Analyze intent]
NLP --> Action{Intent type?}
Action -->|FAQ| Retrieve[Fetch response]
Action -->|Task| Execute[Perform action]
Retrieve --> Reply[Send reply]
Execute --> Reply`,
  },
  {
    id: "f-ml-pipeline",
    name: "Machine Learning Pipeline",
    category: "AI",
    description: "Data collection to model deployment.",
    code: `flowchart TD
Collect --> Clean[Clean data]
Clean --> Train[Train model]
Train --> Validate{Performance OK?}
Validate -->|Yes| Deploy
Validate -->|No| Tune[Hyperparameter tuning]`,
  },
  {
    id: "f-network-routing",
    name: "Network Packet Routing",
    category: "Networking",
    description: "Packet flow through routers and firewalls.",
    code: `flowchart TD
Client --> Router
Router --> Firewall{Allow traffic?}
Firewall -->|Yes| Server
Firewall -->|No| Drop[Drop packet]`,
  },
  {
    id: "f-dns-resolution",
    name: "DNS Resolution",
    category: "Networking",
    description: "Resolve domain names to IP addresses.",
    code: `flowchart TD
Browser --> Cache{In cache?}
Cache -->|Yes| Connect[Connect to IP]
Cache -->|No| Resolver[Ask DNS resolver]
Resolver --> Root[Root server]
Root --> TLD[TLD server]
TLD --> Authoritative[Authoritative server]
Authoritative --> Resolver
Resolver --> Cache --> Connect`,
  },
  {
    id: "f-dev-sprint",
    name: "Agile Sprint Workflow",
    category: "Project Management",
    description: "Plan, execute, review and release sprint tasks.",
    code: `flowchart TD
Backlog --> Plan[Plan sprint]
Plan --> Dev[Development]
Dev --> Test[Test features]
Test --> Review[Code review]
Review --> Deploy[Release to prod]
Deploy --> Retrospect[Retrospective]`,
  },
  {
    id: "f-edu-course",
    name: "Online Course Flow",
    category: "Education",
    description: "Student enrolls, learns, submits, and earns certificate.",
    code: `flowchart TD
Enroll --> Learn[Watch lectures]
Learn --> Quiz[Take quiz]
Quiz --> Submit[Submit assignment]
Submit --> Evaluate{Passed?}
Evaluate -->|Yes| Cert[Issue certificate]
Evaluate -->|No| Retry`,
  },
  {
    id: "f-health-diagnosis",
    name: "Patient Diagnosis",
    category: "Healthcare",
    description: "Symptom check and medical decision-making process.",
    code: `flowchart TD
Patient --> Checkup[Take vitals]
Checkup --> Symptoms{Symptoms known?}
Symptoms -->|Yes| Test[Run tests]
Symptoms -->|No| Refer[Refer specialist]
Test --> Result{Abnormal?}
Result -->|Yes| Treat[Treatment plan]
Result -->|No| Discharge`,
  },
  {
    id: "f-iot-sensor3",
    name: "IoT Sensor Data Flow",
    category: "IoT",
    description: "Collect, transmit, and analyze sensor data.",
    code: `flowchart TD
Sensor --> Gateway[Send data]
Gateway --> Cloud[Push to cloud]
Cloud --> Analyze[Analyze data]
Analyze --> Dashboard[Display insights]`,
  },
  {
    id: "f-smart-home",
    name: "Smart Home Automation",
    category: "IoT",
    description: "Sensor-based device automation.",
    code: `flowchart TD
Sensor --> Controller
Controller --> Condition{Condition met?}
Condition -->|Yes| Action[Trigger device]
Condition -->|No| Idle`,
  },
  {
    id: "f-marketing-funnel",
    name: "Marketing Funnel",
    category: "Marketing",
    description: "Customer journey from awareness to conversion.",
    code: `flowchart TD
Awareness --> Interest
Interest --> Consideration
Consideration --> Intent
Intent --> Purchase
Purchase --> Retention`,
  },
  {
    id: "f-social-share",
    name: "Social Media Share Flow",
    category: "Marketing",
    description: "User sharing and engagement tracking.",
    code: `flowchart TD
Post --> Share[User shares content]
Share --> Feed[Visible in feeds]
Feed --> Engage{Engagement?}
Engage -->|Yes| Notify[Send notification]
Engage -->|No| End`,
  },
  {
    id: "f-email-campaign",
    name: "Email Campaign",
    category: "Marketing",
    description: "Prepare, send, and measure campaign performance.",
    code: `flowchart TD
Create --> Segment[Segment users]
Segment --> Send[Send emails]
Send --> Track[Track opens & clicks]
Track --> Analyze[Measure conversion]`,
  },
  {
    id: "f-cyber-attack",
    name: "Cyber Attack Response",
    category: "Security",
    description: "Detect, isolate, and respond to cyber incidents.",
    code: `flowchart TD
Monitor --> Detect[Detect threat]
Detect --> Analyze[Analyze scope]
Analyze --> Isolate[Isolate systems]
Isolate --> Recover[Restore systems]
Recover --> Report[Incident report]`,
  },
  {
    id: "f-hr-recruitment",
    name: "Recruitment Process",
    category: "HR",
    description: "From job posting to hiring.",
    code: `flowchart TD
Post[Post job] --> Apply[Applications received]
Apply --> Screen[Screen candidates]
Screen --> Interview[Interviews]
Interview --> Offer{Offer made?}
Offer -->|Yes| Hire[Hire candidate]
Offer -->|No| Reject`,
  },
  {
    id: "f-onboarding",
    name: "Employee Onboarding",
    category: "HR",
    description: "Smooth onboarding of new hires.",
    code: `flowchart TD
Hire --> Docs[Collect documents]
Docs --> Setup[Setup accounts]
Setup --> Train[Provide training]
Train --> Assign[Assign mentor]
Assign --> Complete[Onboard complete]`,
  },
  {
    id: "f-banking",
    name: "Bank Loan Approval",
    category: "Finance",
    description: "Loan request, validation, and disbursement.",
    code: `flowchart TD
Apply[Submit loan form] --> Verify[Verify KYC]
Verify --> Credit[Credit check]
Credit --> Approve{Approved?}
Approve -->|Yes| Disburse[Release funds]
Approve -->|No| Reject`,
  },
  {
    id: "f-stock-trade",
    name: "Stock Trading Flow",
    category: "Finance",
    description: "Order execution and settlement.",
    code: `flowchart TD
Investor --> Place[Place order]
Place --> Exchange[Match engine]
Exchange --> Execute[Execute trade]
Execute --> Settle[Clear & settle]
Settle --> Confirm[Send confirmation]`,
  },
  {
    id: "f-hotel-booking",
    name: "Hotel Booking Flow",
    category: "Travel",
    description: "Search, select, pay, confirm booking.",
    code: `flowchart TD
Search --> Select[Choose hotel]
Select --> Pay[Make payment]
Pay --> Confirm[Booking confirmation]
Confirm --> Stay[Check-in]`,
  },
  {
    id: "f-flight-reservation",
    name: "Flight Reservation",
    category: "Travel",
    description: "Search, book, pay, and receive ticket.",
    code: `flowchart TD
Search --> Choose[Select flight]
Choose --> Pay[Pay fare]
Pay --> Ticket[Issue ticket]
Ticket --> Notify[Send confirmation]`,
  },
  {
    id: "f-weather-pipeline",
    name: "Weather Data Pipeline",
    category: "IoT",
    description: "Collect, process, and visualize meteorological data.",
    code: `flowchart TD
Sensors --> Cloud[Collect data]
Cloud --> Process[Clean & aggregate]
Process --> Model[Run forecast model]
Model --> Dashboard[Show weather charts]`,
  },


];