import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import Animes from "./pages/Animes";
import AnimeDetail from "./pages/AnimeDetail";
import Mangas from "./pages/Mangas";
import News from "./pages/News";
import Community from "./pages/Community";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/Header";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Authentication pages without header */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Main app pages with header */}
        <Route>
          <Header />
          <main className="pt-16">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/animes" component={Animes} />
              <Route path="/animes/:id" component={AnimeDetail} />
              <Route path="/mangas" component={Mangas} />
              <Route path="/noticias" component={News} />
              <Route path="/comunidade" component={Community} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
