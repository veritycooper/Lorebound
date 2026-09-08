import { Navigate, Route, Routes } from 'react-router-dom'
import { StoryProvider } from './context/StoryContext'
import BackupPage from './pages/BackupPage'
import ChapterEditor from './pages/ChapterEditor'
import CharacterEditor from './pages/CharacterEditor'
import CharactersPage from './pages/CharactersPage'
import GraphPage from './pages/GraphPage'
import HomePage from './pages/HomePage'
import LawEditor from './pages/LawEditor'
import LawsPage from './pages/LawsPage'
import MagicEditor from './pages/MagicEditor'
import MagicPage from './pages/MagicPage'
import OverviewPage from './pages/OverviewPage'
import PlaceEditor from './pages/PlaceEditor'
import PlacesPage from './pages/PlacesPage'
import SceneIdeasPage from './pages/SceneIdeasPage'
import StoryShell from './pages/StoryShell'
import WritingPage from './pages/WritingPage'

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/story/:storyId"
          element={
            <StoryProvider>
              <StoryShell />
            </StoryProvider>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="characters" element={<CharactersPage />} />
          <Route path="characters/:entityId" element={<CharacterEditor />} />
          <Route path="magic" element={<MagicPage />} />
          <Route path="magic/:entityId" element={<MagicEditor />} />
          <Route path="laws" element={<LawsPage />} />
          <Route path="laws/:entityId" element={<LawEditor />} />
          <Route path="places" element={<PlacesPage />} />
          <Route path="places/:entityId" element={<PlaceEditor />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="writing" element={<WritingPage />} />
          <Route path="writing/:entityId" element={<ChapterEditor />} />
          <Route path="ideas" element={<SceneIdeasPage />} />
          <Route path="backup" element={<BackupPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
