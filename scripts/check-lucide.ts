import * as Lucide from 'lucide-react';
console.log('Github:', 'Github' in Lucide);
console.log('Linkedin:', 'Linkedin' in Lucide);
console.log('GitHub:', 'GitHub' in Lucide);
console.log('LinkedIn:', 'LinkedIn' in Lucide);
const git = Object.keys(Lucide).filter(k => k.toLowerCase().includes('git'));
const link = Object.keys(Lucide).filter(k => k.toLowerCase().includes('link'));
console.log('git:', git);
console.log('link:', link);