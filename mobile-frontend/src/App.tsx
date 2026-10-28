import { useState } from "react";
import { Aviso } from "./pages/Aviso/Aviso";
import { QuestionarioColeta } from "./pages/QuestionarioColeta/QuestionarioColeta";

function App() {
  const [aceitouAviso, setAceitouAviso] = useState(false);

  if (!aceitouAviso) {
    return <Aviso onContinue={() => setAceitouAviso(true)} />;
  }

  return <QuestionarioColeta />;
}

export default App;