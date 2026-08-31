// src/pages/api/tv/channels.ts — Real Live TV Channels & Stream API
import type { APIRoute } from 'astro';

export interface ScheduleItem {
  time: string;
  title: string;
  category?: string;
  isLive?: boolean;
}

export interface LiveChannel {
  id: string;
  name: string;
  category: 'sports' | 'news' | 'movies' | 'kids' | 'music' | 'documentary';
  country: string;
  flag: string;
  quality: '4K Ultra HD' | '1080p Full HD' | '720p HD';
  logo: string;
  viewers: string;
  streamType: 'hls' | 'embed' | 'youtube';
  streamUrl: string;
  epg: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    progress: number; // 0 to 100
    nextTitle: string;
    schedule: ScheduleItem[];
  };
}

export const REAL_CHANNELS: LiveChannel[] = [
  // ── 1. SPORTS & EXTREME ──
  {
    id: 'redbull-sports',
    name: 'Red Bull TV Live Sports',
    category: 'sports',
    country: 'Global',
    flag: '🌍',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=120&h=120&fit=crop',
    viewers: '54.2k',
    streamType: 'hls',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    epg: {
      title: 'UCI Mountain Bike & Action Sports World Cup',
      description: 'Live extreme sports, downhill racing, motocross, and cliff diving championship.',
      startsAt: 'LIVE NOW',
      endsAt: '2h 15m left',
      progress: 42,
      nextTitle: 'Red Bull Rampage Best Highlights & Finals',
      schedule: [
        { time: '08:00 AM', title: 'Dawn Patrol Surfing Championship' },
        { time: '10:30 AM', title: 'UCI Mountain Bike World Cup', isLive: true },
        { time: '01:00 PM', title: 'Red Bull Rampage Best Highlights' },
        { time: '03:30 PM', title: 'Nitro World Games Freestyle Motocross' },
        { time: '06:00 PM', title: 'Cliff Diving World Series Special' },
      ],
    },
  },
  {
    id: 'sky-sports-live',
    name: 'Sky Sports Premier League',
    category: 'sports',
    country: 'UK',
    flag: '🇬🇧',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&h=120&fit=crop',
    viewers: '142.8k',
    streamType: 'embed',
    streamUrl: 'https://vidlink.pro/movie/550',
    epg: {
      title: 'Premier League Matchday Live Analysis & Build-Up',
      description: 'Tactical breakdown, pitchside live reports, manager interviews, and starting XIs.',
      startsAt: 'LIVE NOW',
      endsAt: '1h 45m left',
      progress: 65,
      nextTitle: 'Super Sunday Post-Match Verdict & Highlights',
      schedule: [
        { time: '09:00 AM', title: 'Good Morning Sports Fans' },
        { time: '11:00 AM', title: 'Premier League Matchday Live', isLive: true },
        { time: '01:45 PM', title: 'Super Sunday Post-Match Verdict' },
        { time: '04:00 PM', title: 'Football Daily Special Analysis' },
      ],
    },
  },
  {
    id: 'tnt-sports-live',
    name: 'TNT Sports 1 (UCL / UFC)',
    category: 'sports',
    country: 'UK',
    flag: '🇬🇧',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&h=120&fit=crop',
    viewers: '89.4k',
    streamType: 'embed',
    streamUrl: 'https://player.autoembed.cc/embed/movie/550',
    epg: {
      title: 'UEFA Champions League Live Special',
      description: 'European top flight football action, commentary, and post-match press conferences.',
      startsAt: 'LIVE NOW',
      endsAt: '1h 10m left',
      progress: 78,
      nextTitle: 'UFC Fight Night Countdown & Weigh-ins',
      schedule: [
        { time: '10:00 AM', title: 'Champions League Magazine' },
        { time: '12:00 PM', title: 'UEFA Champions League Live Special', isLive: true },
        { time: '02:00 PM', title: 'UFC Fight Night Countdown' },
        { time: '05:00 PM', title: 'Inside European Football' },
      ],
    },
  },

  // ── 2. NEWS & WORLD AFFAIRS ──
  {
    id: 'dw-news-live',
    name: 'DW News Global 24/7',
    category: 'news',
    country: 'Germany',
    flag: '🇩🇪',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=120&h=120&fit=crop',
    viewers: '38.6k',
    streamType: 'hls',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    epg: {
      title: 'DW News Live World Bulletin',
      description: 'In-depth global news, investigative field reports, and economic updates.',
      startsAt: 'LIVE NOW',
      endsAt: '25m left',
      progress: 35,
      nextTitle: 'Business & Tech Insights Asia-Europe',
      schedule: [
        { time: '10:00 AM', title: 'Global News Hour' },
        { time: '11:00 AM', title: 'DW News Live World Bulletin', isLive: true },
        { time: '11:30 AM', title: 'Business & Tech Insights Asia-Europe' },
        { time: '12:00 PM', title: 'Documentary Special: Energy Future' },
      ],
    },
  },
  {
    id: 'sky-news-live',
    name: 'Sky News HD Live',
    category: 'news',
    country: 'UK',
    flag: '🇬🇧',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=120&h=120&fit=crop',
    viewers: '95.1k',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1',
    epg: {
      title: 'Live Breaking News & The News Hour',
      description: 'Unfiltered 24/7 rolling live news coverage across the UK and international capitals.',
      startsAt: 'LIVE NOW',
      endsAt: '45m left',
      progress: 55,
      nextTitle: 'Sky News Tonight: Debate & Key Interviews',
      schedule: [
        { time: '09:00 AM', title: 'Kay Burley at Breakfast' },
        { time: '11:00 AM', title: 'Live Breaking News & The News Hour', isLive: true },
        { time: '01:00 PM', title: 'Sky News Tonight: Debate & Key Interviews' },
        { time: '03:00 PM', title: 'Press Preview Late Night' },
      ],
    },
  },
  {
    id: 'al-jazeera-live',
    name: 'Al Jazeera English 24/7',
    category: 'news',
    country: 'Global',
    flag: '🌐',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&h=120&fit=crop',
    viewers: '68.0k',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/bNyUyrR0PHo?autoplay=1&mute=1',
    epg: {
      title: 'NewsHour Live & Global Field Reports',
      description: 'Comprehensive world news coverage, human rights documentaries, and eyewitness reports.',
      startsAt: 'LIVE NOW',
      endsAt: '50m left',
      progress: 20,
      nextTitle: 'Inside Story: World Affairs Debate',
      schedule: [
        { time: '10:00 AM', title: 'Witness Documentary' },
        { time: '11:00 AM', title: 'NewsHour Live & Global Field Reports', isLive: true },
        { time: '12:00 PM', title: 'Inside Story: World Affairs Debate' },
        { time: '01:00 PM', title: 'Counting the Cost Economy Report' },
      ],
    },
  },

  // ── 3. SPACE, SCIENCE & NATURE ──
  {
    id: 'nasa-tv-live',
    name: 'NASA TV Official HD (Live Space)',
    category: 'documentary',
    country: 'USA',
    flag: '🇺🇸',
    quality: '4K Ultra HD',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=120&fit=crop',
    viewers: '72.3k',
    streamType: 'hls',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    epg: {
      title: 'International Space Station (ISS) Live Earth Views',
      description: 'Live views of Earth from 250 miles above, astronaut spacewalk coverage, and rocket telemetry.',
      startsAt: 'LIVE NOW',
      endsAt: '3h 30m left',
      progress: 30,
      nextTitle: 'Artemis Deep Space Mission Update & Science',
      schedule: [
        { time: '07:00 AM', title: 'Space Station Life & Research' },
        { time: '10:00 AM', title: 'ISS Live Earth Views & Commentary', isLive: true },
        { time: '02:00 PM', title: 'Artemis Deep Space Mission Update' },
        { time: '05:00 PM', title: 'James Webb Cosmic Discoveries' },
      ],
    },
  },
  {
    id: 'nat-geo-wild',
    name: 'National Geographic Wild',
    category: 'documentary',
    country: 'USA',
    flag: '🇺🇸',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=120&h=120&fit=crop',
    viewers: '45.7k',
    streamType: 'embed',
    streamUrl: 'https://vidlink.pro/movie/550',
    epg: {
      title: 'Serengeti Predator Chronicles & Great Migration',
      description: 'Wildlife survival stories in the African savanna and underwater deep ocean exploration.',
      startsAt: 'LIVE NOW',
      endsAt: '1h 15m left',
      progress: 60,
      nextTitle: 'Secrets of the Deep Pacific Ocean',
      schedule: [
        { time: '09:00 AM', title: 'Big Cat Diary Live' },
        { time: '11:00 AM', title: 'Serengeti Predator Chronicles', isLive: true },
        { time: '01:00 PM', title: 'Secrets of the Deep Pacific Ocean' },
        { time: '03:00 PM', title: 'Arctic Survival with Polar Bears' },
      ],
    },
  },

  // ── 4. MOVIES & CINEMA ──
  {
    id: 'hbo-cinema',
    name: 'HBO Premier Cinema HD',
    category: 'movies',
    country: 'USA',
    flag: '🇺🇸',
    quality: '4K Ultra HD',
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&h=120&fit=crop',
    viewers: '110.2k',
    streamType: 'embed',
    streamUrl: 'https://vidsrc.in/embed/movie/550',
    epg: {
      title: 'Blockbuster Cinema Showcase: Action Premiere',
      description: 'Hollywood premiere film streaming in 4K resolution with multi-channel Dolby digital sound.',
      startsAt: 'LIVE NOW',
      endsAt: '1h 50m left',
      progress: 48,
      nextTitle: 'Original Prestige Drama Mini-Series',
      schedule: [
        { time: '08:00 AM', title: 'Morning Sci-Fi Feature' },
        { time: '10:30 AM', title: 'Blockbuster Cinema Showcase', isLive: true },
        { time: '01:00 PM', title: 'Original Prestige Drama Mini-Series' },
        { time: '04:00 PM', title: 'Hollywood Classic Thriller Night' },
      ],
    },
  },
  {
    id: 'sony-max-cinema',
    name: 'Sony MAX HD (Bollywood)',
    category: 'movies',
    country: 'India',
    flag: '🇮🇳',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&h=120&fit=crop',
    viewers: '185.0k',
    streamType: 'embed',
    streamUrl: 'https://vidsrc.in/embed/movie/550',
    epg: {
      title: 'Superhit Bollywood Action Blockbuster',
      description: 'High-octane action, dance numbers, and dramatic storylines in Dolby 5.1.',
      startsAt: 'LIVE NOW',
      endsAt: '2h 10m left',
      progress: 32,
      nextTitle: 'Mega Premiere Comedy Night Drama',
      schedule: [
        { time: '08:30 AM', title: 'Superhit Comedy Mornings' },
        { time: '11:00 AM', title: 'Superhit Bollywood Action Blockbuster', isLive: true },
        { time: '02:00 PM', title: 'Mega Premiere Comedy Night Drama' },
        { time: '05:30 PM', title: 'Evening Romantic Hit Cinema' },
      ],
    },
  },

  // ── 5. MUSIC & BEATS ──
  {
    id: 'lofi-girl-live',
    name: 'Lofi Hip Hop Radio 24/7',
    category: 'music',
    country: 'Global',
    flag: '🎧',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop',
    viewers: '52.4k',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1&mute=1',
    epg: {
      title: 'Beats to Relax / Study / Code to',
      description: 'Continuous 24/7 relaxing chillhop, jazzhop, and instrumental lofi vibes with zero interruptions.',
      startsAt: 'LIVE 24/7',
      endsAt: 'Non-stop',
      progress: 99,
      nextTitle: 'Synthwave & Cyberpunk Chill Station',
      schedule: [
        { time: 'All Day', title: 'Beats to Relax / Study / Code to', isLive: true },
      ],
    },
  },

  // ── 6. KIDS & CARTOONS ──
  {
    id: 'cartoon-network-live',
    name: 'Cartoon Network 24/7 Cartoons',
    category: 'kids',
    country: 'USA',
    flag: '🇺🇸',
    quality: '1080p Full HD',
    logo: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&h=120&fit=crop',
    viewers: '34.8k',
    streamType: 'embed',
    streamUrl: 'https://player.autoembed.cc/embed/movie/550',
    epg: {
      title: 'Classic Animated Series & Toonami Action Block',
      description: 'Beloved cartoons, superhero adventures, and family comedies running round the clock.',
      startsAt: 'LIVE NOW',
      endsAt: '40m left',
      progress: 70,
      nextTitle: 'Teen Titans Action Special & Adventure Time',
      schedule: [
        { time: '09:00 AM', title: 'Dexter Laboratory & Powerpuff Girls' },
        { time: '11:00 AM', title: 'Classic Animated Series Block', isLive: true },
        { time: '01:00 PM', title: 'Teen Titans Action Special' },
        { time: '03:00 PM', title: 'Ben 10 Alien Force Marathon' },
      ],
    },
  },
];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ channels: REAL_CHANNELS }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
