import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedData {
  source: string;
  confidence: number;
  data: {
    editionName?: string;
    distributor?: string;
    studio?: string;
    releaseDate?: string;
    audioFormats?: string[];
    subtitles?: string[];
    region?: string;
    videoStandard?: string;
    discCount?: number;
    format?: string;
    notes?: string;
    coverImageUrl?: string;
  };
}

/**
 * Scrapes Amazon product page for physical media data
 * Uses User-Agent spoofing to appear as a regular browser
 */
export async function scrapeAmazon(asin: string): Promise<ScrapedData | null> {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const data: ScrapedData['data'] = {};

    // Extract product title
    const title = $('#productTitle').text().trim();
    if (title) data.editionName = title;

    // Extract image
    const mainImage = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
    if (mainImage) data.coverImageUrl = mainImage;

    // Extract product details from the details table
    $('#detailBullets_feature_div li, #productDetails_detailBullets_sections1 tr').each((_, el) => {
      const text = $(el).text();

      // Release date
      if (text.includes('Release date') || text.includes('Date First Available')) {
        const dateMatch = text.match(/\b\w+ \d{1,2}, \d{4}\b/);
        if (dateMatch) data.releaseDate = dateMatch[0];
      }

      // Studio/Distributor
      if (text.includes('Studio') || text.includes('Manufacturer')) {
        const studio = $(el).find('span').last().text().trim();
        if (studio && !studio.includes(':')) {
          data.studio = studio;
          data.distributor = studio;
        }
      }

      // Region
      if (text.includes('Region')) {
        const regionMatch = text.match(/Region ([\w\s]+)/i);
        if (regionMatch) data.region = regionMatch[1].trim();
      }

      // Number of discs
      if (text.includes('Number of discs')) {
        const discMatch = text.match(/(\d+)/);
        if (discMatch) data.discCount = parseInt(discMatch[1]);
      }

      // Format
      if (text.includes('Format')) {
        if (text.includes('Blu-ray')) data.format = 'BLU_RAY';
        else if (text.includes('4K')) data.format = 'BLU_RAY_4K';
        else if (text.includes('DVD')) data.format = 'DVD';
      }

      // Audio
      if (text.includes('Audio') || text.includes('Language')) {
        const audioFormats: string[] = [];
        if (text.includes('Dolby Atmos')) audioFormats.push('Dolby Atmos');
        if (text.includes('DTS-HD Master')) audioFormats.push('DTS-HD Master Audio');
        if (text.includes('DTS-HD')) audioFormats.push('DTS-HD High Resolution');
        if (text.includes('Dolby TrueHD')) audioFormats.push('Dolby TrueHD');
        if (text.includes('Dolby Digital')) audioFormats.push('Dolby Digital');
        if (text.includes('DTS')) audioFormats.push('DTS');
        if (audioFormats.length > 0) data.audioFormats = audioFormats;
      }

      // Subtitles
      if (text.includes('Subtitle')) {
        const subtitles: string[] = [];
        if (text.includes('English')) subtitles.push('English');
        if (text.includes('Spanish')) subtitles.push('Spanish');
        if (text.includes('French')) subtitles.push('French');
        if (subtitles.length > 0) data.subtitles = subtitles;
      }
    });

    // Try to extract from product description
    const description = $('#feature-bullets').text();
    if (description) {
      data.notes = description.trim().substring(0, 500); // Limit length
    }

    if (Object.keys(data).length === 0) {
      return null;
    }

    return {
      source: 'Amazon',
      confidence: 0.8,
      data
    };

  } catch (error: any) {
    console.error('Amazon scraping failed:', error.message);
    return null;
  }
}

/**
 * Scrapes Google Shopping for product data
 * More resilient than direct Amazon scraping
 */
export async function scrapeGoogleShopping(query: string): Promise<ScrapedData | null> {
  try {
    const searchQuery = encodeURIComponent(`${query} DVD Blu-ray`);
    const url = `https://www.google.com/search?q=${searchQuery}&tbm=shop`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const data: ScrapedData['data'] = {};

    // Extract from shopping results
    $('.sh-dgr__content').first().each((_, el) => {
      const title = $(el).find('.tAxDx').text().trim();
      if (title) data.editionName = title;

      const seller = $(el).find('.aULzUe').text().trim();
      if (seller) data.distributor = seller;
    });

    if (Object.keys(data).length === 0) {
      return null;
    }

    return {
      source: 'Google Shopping',
      confidence: 0.6,
      data
    };

  } catch (error: any) {
    console.error('Google Shopping scraping failed:', error.message);
    return null;
  }
}

/**
 * Scrapes eBay for product data (often has detailed specs)
 */
export async function scrapeEbay(query: string): Promise<ScrapedData | null> {
  try {
    const searchQuery = encodeURIComponent(query);
    const url = `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const data: ScrapedData['data'] = {};

    // Get first relevant result
    $('.s-item').first().each((_, el) => {
      const title = $(el).find('.s-item__title').text().trim();
      if (title && !title.includes('Shop on eBay')) {
        data.editionName = title;
      }

      const image = $(el).find('.s-item__image-img').attr('src');
      if (image) data.coverImageUrl = image;
    });

    if (Object.keys(data).length === 0) {
      return null;
    }

    return {
      source: 'eBay',
      confidence: 0.5,
      data
    };

  } catch (error: any) {
    console.error('eBay scraping failed:', error.message);
    return null;
  }
}

/**
 * Master scraper - tries multiple sources and returns best results
 */
export async function scrapeMultipleSources(
  barcode?: string,
  movieTitle?: string,
  year?: number
): Promise<ScrapedData[]> {
  const results: ScrapedData[] = [];

  // Try Amazon if we have an ASIN
  if (barcode && barcode.length === 10) {
    const amazonData = await scrapeAmazon(barcode);
    if (amazonData) results.push(amazonData);
  }

  // Try Google Shopping with movie title
  if (movieTitle) {
    const searchQuery = year ? `${movieTitle} ${year}` : movieTitle;
    const googleData = await scrapeGoogleShopping(searchQuery);
    if (googleData) results.push(googleData);
  }

  // Try eBay as fallback
  if (movieTitle && results.length === 0) {
    const searchQuery = year ? `${movieTitle} ${year} DVD Blu-ray` : `${movieTitle} DVD Blu-ray`;
    const ebayData = await scrapeEbay(searchQuery);
    if (ebayData) results.push(ebayData);
  }

  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
}
