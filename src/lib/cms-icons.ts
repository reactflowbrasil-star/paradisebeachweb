import type { LucideIcon } from "lucide-react";
import { Award, Clock, Gem, Globe, Home, Mail, MapPin, MessageCircle, Phone, Shield, TrendingUp, Users } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Clock,
  Gem,
  Globe,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  TrendingUp,
  Users,
};

export function resolveCmsIcon(name?: string | null): LucideIcon {
  if (!name) return Home;
  return ICON_MAP[name] || Home;
}
