import Quiz from "./components/Quiz";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center pt-8 mb-8">
          Interactive Quiz App
        </h1>
        <Quiz />
      </div>
    </main>
  );
}
