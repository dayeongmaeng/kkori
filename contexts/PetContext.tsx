import React, { createContext, useContext, useEffect, useState } from 'react';
import { PetResponse } from '../lib/api/pet';
import { getCachedCurrentPetId, getCachedPet } from '../lib/cache/pet';

interface PetContextValue {
  currentPet: PetResponse | null;
  setCurrentPet: (pet: PetResponse | null) => void;
}

const PetContext = createContext<PetContextValue>({
  currentPet: null,
  setCurrentPet: () => {},
});

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [currentPet, setCurrentPet] = useState<PetResponse | null>(null);

  useEffect(() => {
    getCachedCurrentPetId().then(async (petId) => {
      if (!petId) return;
      const pet = await getCachedPet(petId);
      if (pet) setCurrentPet(pet);
    });
  }, []);

  return (
    <PetContext.Provider value={{ currentPet, setCurrentPet }}>
      {children}
    </PetContext.Provider>
  );
}

export function useCurrentPet(): PetContextValue {
  return useContext(PetContext);
}
