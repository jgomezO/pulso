// lib/icons.ts
// Catálogo centralizado de íconos de Pulso
// SIEMPRE importar íconos desde este archivo, nunca directo de @gravity-ui/icons
// Para agregar un ícono nuevo: importarlo aquí y re-exportarlo con alias descriptivo

export {
  // Navegación
  House as IconDashboard,
  Persons as IconAccounts,
  Gear as IconSettings,
  Bell as IconNotifications,
  Magnifier as IconSearch,
  ArrowLeft as IconBack,
  ChevronDown as IconChevronDown,
  ChevronRight as IconChevronRight,
  Bars as IconMenu,

  // Acciones
  Plus as IconAdd,
  Pencil as IconEdit,
  TrashBin as IconDelete,
  Copy as IconCopy,
  ArrowUpFromLine as IconExport,
  ArrowDownToLine as IconImport,
  Xmark as IconClose,
  Check as IconCheck,
  Ellipsis as IconMoreActions,
  Funnel as IconFilter,
  ArrowUpArrowDown as IconSort,

  // Cuentas y contactos
  Briefcase as IconCompany,
  Person as IconContact,
  CrownDiamond as IconChampion,
  Star as IconStar,
  CircleLetterT as IconTechnical,
  CircleDollar as IconBilling,
  PersonWorker as IconUser,
  Globe as IconDomain,

  // Timeline y actividades
  Clock as IconTimeline,
  FileText as IconNote,
  Envelope as IconEmail,
  Handset as IconCall,
  Video as IconMeeting,
  LifeRing as IconTicket,
  Flag as IconMilestone,
  ArrowRotateLeft as IconRenewal,

  // Health Score
  HeartPulse as IconHealth,
  ArrowUp as IconTrendUp,
  ArrowDown as IconTrendDown,
  Minus as IconTrendStable,
  CircleExclamation as IconWarning,
  CircleCheck as IconSuccess,
  CircleXmark as IconDanger,
  ChartLine as IconTrending,

  // Tareas
  CircleCheckFill as IconTaskDone,
  Circle as IconTaskPending,
  CircleDashed as IconTaskInProgress,
  ListCheck as IconTasks,

  // Plans
  Rocket as IconPlan,
  TargetDart as IconObjective,
  LayoutList as IconTemplate,

  // Integraciones (futuro)
  PlugConnection as IconIntegration,
  LogoSlack as IconSlack,

  // Auth
  ArrowRightFromSquare as IconLogout,

  // Forms
  FileDollar as IconContract,
  PersonGear as IconAssignment,

  // Misc
  CircleInfo as IconInfo,
  FileArrowUp as IconUpload,
  Calendar as IconCalendar,
  Tag as IconTag,
  Sparkles as IconAI,
} from '@gravity-ui/icons'
