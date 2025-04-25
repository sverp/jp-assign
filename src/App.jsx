import Sidebar from "./components/Sidebar.jsx";
import MidArea from "./components/MidArea.jsx";
import PreviewArea from "./components/PreviewArea.jsx";
import { GlobalProvider } from "./GlobalContext/GlobalContext.jsx";

const App = () => {
  return (
    <GlobalProvider>
      <div className="flex flex-row">
        <Sidebar />
        <MidArea />
        <PreviewArea />
      </div>
    </GlobalProvider>
  );
};

export default App;
