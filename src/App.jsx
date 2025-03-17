import { useState } from 'react'
import FaceDetectionApp from './components/FaceDetectionApp'

function App() {
  const [count, setCount] = useState(0)

  return (
  <div className="h-screen">

  
  <FaceDetectionApp/>

  </div>
      
  )
}

export default App
