import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBangladeshDateTime() {
  const now = new Date();
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka'
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Dhaka'
  };

  const banglaDate = new Intl.DateTimeFormat('bn-BD', dateOptions).format(now);
  const englishDate = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
  const time = new Intl.DateTimeFormat('en-US', timeOptions).format(now);

  return {
    bangla: banglaDate,
    english: englishDate,
    time: time
  };
}

export function formatPrice(price: number) {
  return `৳${price.toLocaleString('bn-BD')}`;
}

export function formatDate(date: any) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export async function compressImage(file: File): Promise<string> {
  console.log(`🖼️ Compressing: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  return new Promise((resolve, reject) => {
    // Increased timeout for slow devices/large files
    const timeout = setTimeout(() => {
      console.error('❌ Compression timeout hit for:', file.name);
      reject(new Error('ইমেজ প্রসেস করতে অনেক সময় লাগছে (Timeout)'));
    }, 30000); 
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; // Small size for database storage
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Return as base64 string with 0.5 quality for small DB size
        const base64String = canvas.toDataURL('image/jpeg', 0.5);
        console.log(`✅ Compression done: ~${Math.round(base64String.length / 1024)} KB`);
        resolve(base64String);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('File read failed'));
    };
  });
}
