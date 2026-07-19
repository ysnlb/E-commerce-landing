// Fixed icon set for feature rows. The DB stores the key string
// (products.features[].icon); the template renderers resolve it
// through this same map, so keys must stay stable.
import {
  BatteryFull,
  Boxes,
  Droplets,
  Package,
  Ruler,
  Shirt,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Truck,
  Zap,
} from 'lucide-react'

export const FEATURE_ICONS = {
  package: Package,
  boxes: Boxes,
  'shield-check': ShieldCheck,
  truck: Truck,
  star: Star,
  zap: Zap,
  timer: Timer,
  battery: BatteryFull,
  ruler: Ruler,
  shirt: Shirt,
  droplets: Droplets,
  sparkles: Sparkles,
}

// Tooltip labels for the icon picker.
export const FEATURE_ICON_LABELS = {
  package: 'تغليف / علبة',
  boxes: 'تنظيم / سعة',
  'shield-check': 'جودة / ضمان',
  truck: 'توصيل',
  star: 'تقييم',
  zap: 'أداء / سرعة',
  timer: 'توفير الوقت',
  battery: 'بطارية',
  ruler: 'مقاسات',
  shirt: 'خامة / قماش',
  droplets: 'مقاوم للماء',
  sparkles: 'سهل التنظيف',
}
