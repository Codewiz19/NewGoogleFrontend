# Frontend - Legal Document Analysis Application

React-based frontend for the Legal Document Analysis application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## ⚙️ Configuration

### API Configuration

The API base URL is configured in `src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

### Environment Variables

Create a `.env` file in the `Frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production:
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── pages/              # Main application pages
│   │   ├── Upload.tsx      # Document upload page
│   │   ├── Dashboard.tsx   # Overview dashboard
│   │   ├── RiskAnalysis.tsx # Risk analysis with highlighting
│   │   ├── ChatBot.tsx     # Chat interface
│   │   ├── DocumentSummary.tsx # Document summary view
│   │   └── Export.tsx      # Export functionality
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   └── layout/        # Layout components
│   ├── lib/
│   │   ├── api.ts         # API endpoint configuration
│   │   ├── documentCache.ts # Local storage cache
│   │   └── utils.ts       # Utility functions
│   └── App.tsx            # Main app component
├── public/                # Static assets
└── package.json          # Dependencies
```

## 🔌 API Integration

### API Endpoints (defined in `src/lib/api.ts`)

```typescript
export const API = {
  upload: `${API_BASE_URL}/upload`,
  summarize: `${API_BASE_URL}/summarize`,
  risks: `${API_BASE_URL}/risks`,
  chat: `${API_BASE_URL}/chat`,
  getDocument: (docId: string) => `${API_BASE_URL}/document/${docId}`,
  debugRag: (docId: string) => `${API_BASE_URL}/debug_rag/${docId}`,
  lawyerQuestions: `${API_BASE_URL}/lawyer-questions`,
};
```

### Usage Example

```typescript
import API from "@/lib/api";

// Upload document
const formData = new FormData();
formData.append('file', file);
const response = await fetch(API.upload, {
  method: 'POST',
  body: formData
});

// Get document data
const docResponse = await fetch(API.getDocument(docId));
const data = await docResponse.json();
```

## 🎨 Features

### 1. Document Upload
- Drag-and-drop interface
- File validation
- Progress tracking

### 2. Dashboard
- Document summary display
- Risk overview
- Quick navigation

### 3. Risk Analysis
- Filtered risk display (Medium/High only)
- Real explanations (no generic content)
- Document highlighting
- Page navigation

### 4. Chat Interface
- Query document content
- Context-aware responses
- Message history

### 5. Export
- Export analysis results
- Multiple format support

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Tech Stack

- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Router** - Routing
- **Framer Motion** - Animations

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy to Netlify

```bash
netlify deploy --prod --dir=dist
```

### Environment Variables for Production

Set `VITE_API_BASE_URL` in your deployment platform's environment variables.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🐛 Troubleshooting

### API Connection Issues
1. Check `VITE_API_BASE_URL` in `.env`
2. Verify backend server is running
3. Check CORS configuration on backend

### Build Errors
1. Clear `node_modules` and reinstall
2. Check Node.js version (18+)
3. Verify all dependencies are installed

### Development Server Issues
1. Check port 5173 is available
2. Try clearing Vite cache: `rm -rf node_modules/.vite`

## 📄 License

[Add license information]
