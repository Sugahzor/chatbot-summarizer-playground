// import Chatbot from './components/chat/Chatbot';
import { ReviewList } from './components/reviews/ReviewList';

function App() {
  return (
    <div className="p-4 h-screen w-10/12 mx-auto">
      {/* <Chatbot /> */}
      <ReviewList productId={1} />
    </div>
  );
}

export default App;
