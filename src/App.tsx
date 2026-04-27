import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/context/GameContext";
import Index from "./pages/Index.tsx";
import Setup from "./pages/Setup.tsx";
import Reveal from "./pages/Reveal.tsx";
import Game from "./pages/Game.tsx";
import TimeEnd from "./pages/TimeEnd.tsx";
import Vote from "./pages/Vote.tsx";
import Result from "./pages/Result.tsx";
import CreateRoom from "./pages/CreateRoom.tsx";
import Room from "./pages/Room.tsx";
import RoomReveal from "./pages/RoomReveal.tsx";
import RoomGame from "./pages/RoomGame.tsx";
import RoomVote from "./pages/RoomVote.tsx";
import RoomResult from "./pages/RoomResult.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/reveal" element={<Reveal />} />
            <Route path="/game" element={<Game />} />
            <Route path="/time-end" element={<TimeEnd />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/result" element={<Result />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/room/:code/reveal" element={<RoomReveal />} />
            <Route path="/room/:code/game" element={<RoomGame />} />
            <Route path="/room/:code/vote" element={<RoomVote />} />
            <Route path="/room/:code/result" element={<RoomResult />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
