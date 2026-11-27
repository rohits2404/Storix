import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme-provider";
import AppRoutes from "./routes";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <TooltipProvider>
                <AppRoutes />
            </TooltipProvider>
        </ThemeProvider>
    );
}

export default App;
