# Bitcoin Universal Basic Income Web-of-Trust

A decentralized platform implementing Bitcoin Universal Basic Income through a web-of-trust model.

## Key Design Features

### 🪙 Token Distribution System
- **Rate**: ¤0.0001 per second continuous accrual
- **Epoch Logging**: Real-time console logging of epoch time and distribution rate
- **Session-Based**: Tokens accrue during active browser sessions
- **Collection Fee**: ¤0.01 fee for token collection (prevents spam)
- **3% Annual Inflation**: Token rate increases over time based on withdrawal history

### 🔐 Authentication System
- **Multi-Method Auth**: Supports password, user ID, and session ID authentication
- **Session Persistence**: Automatic session creation and management
- **Anonymous Support**: Full functionality without required login
- **Fallback Mechanisms**: Graceful degradation across authentication methods

### 📝 Content Platform
- **Anonymous Posting**: Create posts without authentication
- **Value Donations**: Users can donate tokens to posts and replies
- **Character-Based Pricing**: ¤0.1 per character for post creation
- **Post Promotion**: Authors can burn tokens to promote their content

### 🔍 Transparency Features
- **Token Burn Tracking**: All burned tokens recorded on-chain
- **Transaction History**: Complete audit trail of all token movements
- **Global Token Metrics**: Real-time tracking of total issued/burned tokens
- **Rate Logging**: Frontend console displays epoch time and distribution rate

### 💡 Technical Architecture
- **PostgreSQL Database**: Robust data persistence with Prisma ORM
- **Next.js Frontend**: Server-side rendering with real-time updates
- **API-First Design**: RESTful endpoints for all core functionality
- **Session Management**: Browser localStorage with server-side validation

### 🎯 Economic Model
- **Deflationary Mechanism**: Token collection fees reduce circulating supply
- **Participation Incentives**: Rewards for content creation and curation
- **Anti-Spam Protection**: Small fees prevent system abuse
- **Transparent Economics**: All token flows publicly auditable

## Development Status
Currently under active development. Core token distribution and collection systems are functional.

## Console Logging
The frontend logs real-time metrics including:
- Current epoch timestamp
- Token distribution rate (¤0.0001/sec)
- Accrued token amounts
- Session duration

Check browser console for detailed token accrual information.