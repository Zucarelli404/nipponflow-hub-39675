// Carrega os arquivos JSON de DADOS DEMO e expõe um objeto consolidado
// para uso pelo cliente mock do Supabase.
// Todos os arquivos possuem meta { source: "DADOS DEMO" } para identificação.

import roles from "./demo-data/roles.json";
import modules from "./demo-data/modules.json";
import role_module_permissions from "./demo-data/role_module_permissions.json";
import user_roles from "./demo-data/user_roles.json";
import profiles from "./demo-data/profiles.json";
import leads from "./demo-data/leads.json";
import visit_reports from "./demo-data/visit_reports.json";
import visit_items from "./demo-data/visit_items.json";
import invoices from "./demo-data/invoices.json";
import scheduled_visits from "./demo-data/scheduled_visits.json";
import event_notifications from "./demo-data/event_notifications.json";
import courses from "./demo-data/courses.json";
import candidates from "./demo-data/candidates.json";
import products from "./demo-data/products.json";
import stock_movements from "./demo-data/stock_movements.json";
import user_trail_progress from "./demo-data/user_trail_progress.json";
import reward_redemptions from "./demo-data/reward_redemptions.json";
import audit_logs from "./demo-data/audit_logs.json";
import notes from "./demo-data/notes.json";

type JsonFile<T> = { meta: { source: string; generated_at: string }; data: T[] };

// Helper para acessar a propriedade data independentemente de typings
const pick = <T = any>(jf: any): T[] => (jf && jf.data ? jf.data : []);

export const demoDatasets: any = {
  roles: pick(roles as JsonFile<any>),
  modules: pick(modules as JsonFile<any>),
  role_module_permissions: pick(role_module_permissions as JsonFile<any>),
  user_roles: pick(user_roles as JsonFile<any>),
  profiles: pick(profiles as JsonFile<any>),
  leads: pick(leads as JsonFile<any>),
  visit_reports: pick(visit_reports as JsonFile<any>),
  visit_items: pick(visit_items as JsonFile<any>),
  invoices: pick(invoices as JsonFile<any>),
  scheduled_visits: pick(scheduled_visits as JsonFile<any>),
  event_notifications: pick(event_notifications as JsonFile<any>),
  courses: pick(courses as JsonFile<any>),
  candidates: pick(candidates as JsonFile<any>),
  products: pick(products as JsonFile<any>),
  stock_movements: pick(stock_movements as JsonFile<any>),
  user_trail_progress: pick(user_trail_progress as JsonFile<any>),
  reward_redemptions: pick(reward_redemptions as JsonFile<any>),
  audit_logs: pick(audit_logs as JsonFile<any>),
  notes: pick(notes as JsonFile<any>),
};

export function initializeDemoData() {
  try {
    (globalThis as any).__DEMO_DATASETS = demoDatasets;
    // Também marcar em localStorage que dados DEMO foram carregados
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("demo_data_source", "DADOS DEMO");
    }
  } catch (e) {
    // Nada impede inicialização do sistema caso falhe
    console.warn("Falha ao inicializar DADOS DEMO:", e);
  }
}

