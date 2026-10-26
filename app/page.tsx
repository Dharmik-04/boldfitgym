'use client';

import React, { useEffect, useState } from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Flame,
  UserCheck,
  Wind,
  Star,
  ArrowRight,
  Shield,
  Calendar,
  MapPin,
  Clock,
  Mail,
  Check,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/apiConfig';

export default function Home() {
  const { heroConfig, programs, pricingPlans } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activePlans, setActivePlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivePlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/membership-plans`);
        const data = await res.json();
        if (res.ok && data.success) {
          const list = data.data.plans || [];
          const activeList = list.filter((p: any) => p.status === 'active');
          if (activeList.length > 0) {
            setActivePlans(activeList);
          } else {
            setActivePlans(pricingPlans);
          }
        } else {
          setActivePlans(pricingPlans);
        }
      } catch (err) {
        console.error('Failed to fetch membership plans:', err);
        setActivePlans(pricingPlans);
      }
    };
    fetchActivePlans();
  }, [pricingPlans]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <div 
      className="text-zinc-55 font-sans selection:bg-[#FFE600] selection:text-black min-h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('/gym-sections-bg.jpg')", 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundAttachment: 'fixed' 
      }}
    >

      {/* Hero Section */}
      <ScrollExpandMedia>
        {/* Interactive Quick Links Grid (revealed immediately after hero expands) */}
        <div
          id="quick-links"
          className="max-w-7xl mx-auto mb-24 relative rounded-3xl border border-white/10 p-8 md:p-12 overflow-hidden bg-black/80 backdrop-blur-md shadow-2xl"
        >
          <div className="relative z-10">
            <div className="text-center space-y-3 mb-12">
              <span className="text-xs font-black uppercase tracking-widest text-[#FFE600] bg-[#FFE600]/10 border border-[#FFE600]/25 px-3 py-1 rounded-full">
                EXPLORE BOLD ACADEMY
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                QUICK NAVIGATION
              </h2>
              <p className="text-xs text-zinc-300 uppercase tracking-widest">
                Select a tile below to jump directly to academy sections
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  title: 'Training Programs',
                  anchor: '#programs',
                  icon: <Dumbbell className="w-5 h-5" />,
                  desc: 'Explore Hypertrophy, CrossFit, Coaching & Recovery.',
                },
                {
                  title: 'Facility Showcase',
                  anchor: '#facility',
                  icon: <Activity className="w-5 h-5" />,
                  desc: 'Tour our platform blueprint and mock 3D render workspace.',
                },
                {
                  title: 'Membership Pricing',
                  anchor: '#pricing',
                  icon: <Award className="w-5 h-5" />,
                  desc: 'Select day pass, monthly card, or coaching tier.',
                },
                {
                  title: 'Client Dashboard',
                  anchor: '/admin',
                  icon: <UserCheck className="w-5 h-5" />,
                  desc: 'Access configuration editor, prices, and programs.',
                  isLink: true,
                },
              ].map((tile, i) => {
                const content = (
                  <motion.div
                    whileHover={{ y: -10, scale: 1.025, boxShadow: '0 20px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: 'rgba(255,230,0,0.35)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className="h-full flex flex-col justify-between p-6 bg-transparent border border-white/10 rounded-2xl text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[#FFE600]/5 group-hover:bg-[#FFE600]/10 transition-all duration-300 blur-2xl" />
                    <div className="space-y-4">
                      <div className="w-10 h-10 rounded-xl bg-transparent border border-white/10 flex items-center justify-center text-[#FFE600]">
                        {tile.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-[#FFE600] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                          {tile.title}
                        </h4>
                        <p className="text-[10px] text-zinc-300 font-semibold leading-normal mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                          {tile.desc}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[9px] font-black uppercase text-zinc-400 group-hover:text-[#FFE600] transition-colors">
                      GO TO SECTION <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );

                if (tile.isLink) {
                  return (
                    <Link href={tile.anchor} key={i} className="h-full block">
                      {content}
                    </Link>
                  );
                }

                return (
                  <a href={tile.anchor} key={i} className="h-full block">
                    {content}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic description list overlaying the scroll expansion flow */}
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              ABOUT THE ACADEMY
            </h2>
            <div className="w-16 h-1 bg-[#FFE600] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-300">
            <motion.div
              whileHover={{ y: -10, scale: 1.025, boxShadow: '0 20px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: 'rgba(255,230,0,0.35)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-3xl space-y-4 shadow-2xl cursor-pointer"
            >
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                <Shield className="w-5 h-5 text-[#FFE600]" /> High-Performance Culture
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                Bold Fitness isn&apos;t just a gym; it&apos;s a high-performance lab designed for physical dominance. Our custom 3D training frame is built to facilitate complex structural training, powerlifting, and olympic level execution.
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ y: -10, scale: 1.025, boxShadow: '0 20px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: 'rgba(255,230,0,0.35)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-3xl space-y-4 shadow-2xl cursor-pointer"
            >
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                <Award className="w-5 h-5 text-[#FFE600]" /> Science-Backed Methods
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                Every square foot of our ultimate training facility is laid out to optimize layout transitions, reduce session fatigue, and keep athletes locked in. Train with direct visual feedback and dynamic coaching.
              </p>
            </motion.div>
          </div>
        </div>
      </ScrollExpandMedia>

      {/* Training Programs Section */}
      <section id="programs" className="py-24 px-6 md:px-12 relative overflow-hidden bg-transparent z-10">
            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,30,39,0.04),rgba(255,255,255,0))] z-0" />
            
            <div className="max-w-7xl mx-auto relative z-10 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
            <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest">
              WHAT WE OFFER
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              ELITE TRAINING PROGRAMMING
            </h2>
            <p className="text-zinc-300 text-sm max-w-xl mx-auto">
              Choose your path to optimization. All programs are engineered by certified coaches and custom-fit to your performance metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program, idx) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -12, scale: 1.025, boxShadow: '0 25px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: 'rgba(255,230,0,0.35)' }}
                className="group relative p-8 rounded-3xl bg-black/80 border border-white/10 backdrop-blur-md overflow-hidden flex flex-col justify-between h-[320px] cursor-pointer shadow-2xl"
              >
                {/* Glow Element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#FFE600]/5 group-hover:bg-[#FFE600]/10 transition-all duration-300" />
                
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-center text-[#FFE600] mb-6">
                    {program.icon === 'Dumbbell' && <Dumbbell className="w-6 h-6" />}
                    {program.icon === 'Flame' && <Flame className="w-6 h-6" />}
                    {program.icon === 'UserCheck' && <UserCheck className="w-6 h-6" />}
                    {program.icon === 'Wind' && <Wind className="w-6 h-6" />}
                  </div>
                  
                  <h3 className="text-lg font-black uppercase text-white tracking-wide mb-3 group-hover:text-[#FFE600] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {program.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-300 group-hover:text-[#FFE600] mt-6 transition-all">
                  Learn more <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facility & 3D Showcase Section */}
      <section id="facility" className="py-24 px-6 md:px-12 relative overflow-hidden bg-transparent z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Features Column */}
          <div className="space-y-8 bg-black/80 border border-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
            <div className="space-y-4">
              <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest">
                THE FACILITY
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                THE ULTIMATE <br />TRAINING GROUND
              </h2>
              <div className="w-12 h-1 bg-[#FFE600] rounded-full" />
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Explore a premium facility built exclusively for those dedicated to pushing boundaries. Our recovery zones, strength equipment layout, and high-intensity metabolic cages are set up for performance.
            </p>

            <ul className="space-y-4">
              {[
                'Custom engineered free-weight lifting platforms',
                'Advanced cardio metrics and high-speed treadmills',
                'Dedicated functional CrossFit rigs & gymnastics cages',
                'Recovery room with custom ice bath and infrared sauna'
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300 font-semibold">
                  <Check className="w-5 h-5 text-[#FFE600] shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Media / 3D Model Placeholder */}
          <motion.div
            whileHover={{ y: -10, scale: 1.02, boxShadow: '0 25px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: 'rgba(255,230,0,0.35)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative aspect-square w-full max-w-lg mx-auto bg-black/80 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer flex flex-col justify-between overflow-hidden group"
          >
            
            {/* Visual background lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Facility GLB Model</span>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">3D INTERACTIVE VIEW</span>
            </div>

            {/* Mock Gym Blueprint Grid Render */}
            <div className="relative z-10 w-full h-48 border border-white/10 rounded-2xl bg-transparent flex items-center justify-center overflow-hidden">
              <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-[#FFE600]/20 animate-spin" style={{ animationDuration: '30s' }} />
              <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-zinc-800" />
              <Dumbbell className="w-12 h-12 text-[#FFE600]/60 z-10" />
            </div>

            <div className="relative z-10 space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">BLUEPRINT INTERVIEW SCAN</h4>
              <p className="text-[11px] text-zinc-300">
                Interactive glb model rendering is active. Click and drag within this card to view equipment layout options and cage specifications.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" className="py-24 px-6 md:px-12 relative overflow-hidden bg-transparent z-10">
        {/* Radial Ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(255,30,39,0.06),rgba(255,255,255,0))] z-0" />
        
        <div className="max-w-6xl mx-auto relative z-10 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
            <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest">
              MEMBERSHIP PLANS
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              MEMBERSHIPS THAT BUILD ELITE STATUS
            </h2>
            <p className="text-zinc-300 text-sm max-w-xl mx-auto">
              No long term contracts. Choose the package that suits your current training cycle. Cancel any time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {activePlans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -12, scale: plan.popular ? 1.075 : 1.03, boxShadow: '0 25px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: plan.popular ? '#FFE600' : 'rgba(255,230,0,0.2)' }}
                className={`relative flex flex-col justify-between p-8 rounded-3xl bg-black/80 border backdrop-blur-md shadow-2xl ${
                  plan.popular
                    ? 'border-[#FFE600] shadow-xl shadow-[#FFE600]/5 scale-105 relative z-10'
                    : 'border-white/10'
                }`}
              >
                {/* Popular Pill Label */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#FFE600] text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    MOST POPULAR
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-black uppercase text-zinc-200 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                      {plan.name}
                    </h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]">${plan.price}</span>
                      <span className="text-xs text-zinc-200 uppercase font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">/ {plan.billing_period || plan.billing}</span>
                    </div>
                  </div>

                  <hr className="border-white/10" />

                  <ul className="space-y-3.5">
                    {(Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? plan.features.split(',') : [])).map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-3 text-xs text-zinc-300">
                        <Check className="w-4.5 h-4.5 text-[#FFE600] shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="#cta"
                    className={`block w-full py-3.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      plan.popular
                        ? 'bg-[#FFE600] text-black font-bold shadow-lg shadow-[#FFE600]/25 hover:bg-[#e0ca00] hover:scale-103'
                        : 'bg-zinc-950 text-white hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    Select Membership
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Social Proof Section */}
      <section id="testimonials" className="py-24 px-6 md:px-12 relative overflow-hidden bg-transparent z-10">
        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
            <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              ATHLETE TRANSFORMATIONS
            </h2>
            <p className="text-zinc-300 text-sm max-w-xl mx-auto">
              Real results from verified members of our academy. See physical progression statistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Marcus Vance',
                role: 'Powerlifter',
                stat: 'Muscle Gain: +14 lbs',
                quote: 'The environment here is unlike anything else. Custom rigs and dynamic spacing allows you to perform heavy lifts without bottlenecking or crowd distractions.',
                stars: 5,
              },
              {
                name: 'Sarah Jennings',
                role: 'CrossFit Competitor',
                stat: 'Fat Loss: -18 lbs',
                quote: 'Using the recovery sauna and infrared chambers after heavy metabolic days is a complete game changer. My muscle repair and joint health has never been better.',
                stars: 5,
              },
              {
                name: 'David Kim',
                role: 'Casual Trainee',
                stat: 'Body Fat: -8%',
                quote: 'The 1-on-1 coaching program paired with customized nutrition plans in the members portal kept me highly accountable. Absolutely worth every single cent.',
                stars: 5,
              },
            ].map((t, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10, scale: 1.025, boxShadow: '0 20px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,230,0,0.25)', borderColor: 'rgba(255,230,0,0.35)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="p-8 rounded-3xl bg-black/80 border border-white/10 flex flex-col justify-between gap-6 cursor-pointer animate-none shadow-2xl backdrop-blur-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#FFE600] text-[#FFE600]" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-xs italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <h5 className="text-sm font-bold text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">{t.name}</h5>
                    <span className="text-[10px] text-zinc-300 uppercase font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">{t.role}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFE600] bg-[#FFE600]/10 px-2.5 py-1 rounded-full border border-[#FFE600]/15">
                    {t.stat}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA & Email form */}
      <section id="cta" className="py-20 px-6 md:px-12 relative overflow-hidden bg-transparent z-10">
        <div className="absolute inset-0 bg-[#FFE600]/3 blur-3xl z-0" />
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8 bg-black/80 border border-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            CLAIM YOUR 3-DAY FREE PASS
          </h2>
          <p className="text-sm text-zinc-300 max-w-lg mx-auto">
            Experience our ultimate training ground firsthand. Enter your details to receive an instant keycard guest pass via email.
          </p>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-transparent border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white"
              required
            />
            <button
              type="submit"
              className="bg-[#FFE600] hover:bg-[#e0ca00] text-black font-bold text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg transition-all"
            >
              Get Guest Pass
            </button>
          </form>

          {submitted && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#FFE600] text-xs font-bold uppercase tracking-wider"
            >
              ✓ Thank you! Check your inbox for your 3-day activation link.
            </motion.p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-12 bg-[#050507] border-t border-zinc-950 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-zinc-900 pb-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FFE600]" />
              <span className="text-md font-black uppercase tracking-wider text-white">
                Bold<span className="text-[#FFE600]">.</span>
              </span>
            </div>
            <p className="leading-relaxed">
              High-performance laboratory designed for structural hypertrophy, precision powerlifting, and recovery optimization.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-zinc-200 font-bold uppercase tracking-wider">Hours</h5>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-zinc-400" /> Mon - Fri: 5AM - 11PM</p>
              <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-zinc-400" /> Sat - Sun: 7AM - 9PM</p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-zinc-200 font-bold uppercase tracking-wider">Location</h5>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> 842 Performance Dr</p>
              <p className="flex items-center gap-2">Austin, TX 78701</p>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-zinc-200 font-bold uppercase tracking-wider">Social Channels</h5>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163c-.272-1.018-1.07-1.819-2.087-2.093-1.849-.498-9.261-.498-9.261-.498s-7.411 0-9.26.498c-1.018.274-1.817 1.075-2.09 2.093-.497 1.849-.497 5.716-.497 5.716s0 3.868.497 5.717c.273 1.018 1.072 1.819 2.09 2.093 1.849.498 9.26.498 9.26.498s7.412 0 9.261-.498c1.017-.274 1.815-1.075 2.087-2.093.499-1.849.499-5.717.499-5.717s0-3.867-.499-5.716zm-14.498 9.837v-8l6.998 4-6.998 4z"/></svg>
              </a>
            </div>
            <p className="text-[10px] text-zinc-600">
              Authorized admin staff can access configuration settings on the client portal.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Bold Fitness Academy. All rights reserved.</p>
          <div className="flex gap-6 text-[10px] uppercase font-bold tracking-wider">
            <Link href="/admin" className="hover:text-[#FFE600] transition-colors">Admin Dashboard Login</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>


      {/* Floating Bottom-Right Contact Trigger */}
      {scrollY > 300 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40 bg-zinc-950/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl space-y-3 max-w-[280px]"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FFE600]" />
            <span className="text-xs font-black uppercase text-white tracking-wider">Bold Fitness HQ</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">OPERATIONAL HOURS</span>
            <p className="text-[10px] text-zinc-300 leading-tight">Mon - Fri: 5AM - 11PM<br />Sat - Sun: 7AM - 9PM</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">CONTACT ADDRESS</span>
            <p className="text-[10px] text-zinc-300 leading-tight">842 Performance Dr, Austin, TX</p>
          </div>
          <div className="pt-1">
            <a
              href="#pricing"
              className="block w-full py-2 bg-[#FFE600] hover:bg-[#e0ca00] text-black font-bold text-[10px] font-black uppercase tracking-wider rounded-lg text-center transition-colors"
            >
              Book Guest Pass
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
