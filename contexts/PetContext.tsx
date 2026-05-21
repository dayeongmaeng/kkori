import React, { createContext, useContext, useEffect, useState } from 'react';
import { PetResponse } from '../lib/api/pet';
import { getCachedCurrentPetId, getCachedPet } from '../lib/cache/pet';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated, isAuthLoading, sessionDataVersion } = useAuth();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setCurrentPet(null);
      return;
    }

    getCachedCurrentPetId().then(async (petId) => {
      if (!petId) return;
      const pet = await getCachedPet(petId);
      if (pet) setCurrentPet(pet);
    });
  }, [isAuthenticated, isAuthLoading, sessionDataVersion]);

  return (
    <PetContext.Provider value={{ currentPet, setCurrentPet }}>
      {children}
    </PetContext.Provider>
  );
}

export function useCurrentPet(): PetContextValue {
  return useContext(PetContext);
}
