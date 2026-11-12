
import { Route, Switch } from "wouter";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import ModulePage from "./pages/ModulePage";
import MasonryTests from "./pages/MasonryTests";
import Complaints from "./pages/Complaints";
import Reports from "./pages/Reports";
import ReportDesignerPage from "./pages/ReportDesignerPage";
import Archive from "./pages/Archive";
import Standards from "./pages/Standards";
import Analytics from "./pages/Analytics";
import { QcReferenceProvider } from "./components/QcReferenceProvider";
import Users from "./pages/Users";

export function App() {
  return (
  <QcReferenceProvider> {
    <AppLayout>
      <Switch>

        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/records" component={Records} />
        <Route path="/records/:category" component={Records} />
        <Route path="/masonry-tests" component={MasonryTests} />
        <Route path="/complaints" component={Complaints} />
        <Route path="/report-designer" component={ReportDesignerPage} />
        <Route path="/reports" component={Reports} />
        <Route path="/archive" component={Archive} />
        <Route path="/standards" component={Standards} />
        <Route path="/users" component={Users} />
        <Route path="/settings" component={ModulePage} />
        <Route component={ModulePage} />

      </Switch>
    </AppLayout>
    }
  </QcReferenceProvider>
  );
}
