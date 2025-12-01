import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

// Generate a single user object
export function generateUser(): User {
  const hobbyList = [
    'Reading', 'Gaming', 'Cooking', 'Hiking', 'Photography',
    'Painting', 'Dancing', 'Swimming', 'Cycling', 'Gardening',
    'Writing', 'Music', 'Travel', 'Yoga', 'Fishing',
    'Chess', 'Running', 'Skiing', 'Surfing', 'Climbing'
  ];

  const hobbyCount = faker.number.int({ min: 0, max: 10 });
  const hobbies = faker.helpers.shuffle(hobbyList).slice(0, hobbyCount);

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: faker.string.uuid(),
    avatar: `https://randomuser.me/api/portraits/${faker.helpers.arrayElement(['men', 'women'])}/${faker.number.int({ min: 0, max: 99 })}.jpg`,
    first_name: firstName,
    last_name: lastName,
    age: faker.number.int({ min: 18, max: 80 }),
    nationality: faker.location.country(),
    hobbies: hobbies.length > 0 ? hobbies : [faker.helpers.arrayElement(hobbyList)]
  };
}

// Generate a dataset of users
export function generateUsers(count = 1000): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push(generateUser());
  }
  return users;
}

// Generate the dataset once on server start
export const USERS_DATASET = generateUsers(1000);
