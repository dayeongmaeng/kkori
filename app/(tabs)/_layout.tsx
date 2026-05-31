import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { CatProfileIcon, DogProfileIcon, HomeIcon, PhotoIcon, RecordsIcon, SettingsIcon } from '../../components/TabIcons';
import { colors } from '../../constants/theme';
import { useCurrentPet } from '../../contexts/PetContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentPet } = useCurrentPet();

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 0,
            paddingBottom: insets.bottom,
            height: 50 + insets.bottom,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            margin: 0,
          },
          tabBarIconStyle: {
            width: 30,
            height: 30,
            margin: 0,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '기록',
            tabBarIcon: ({ color }) => <RecordsIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="photo"
          options={{
            title: '포토',
            tabBarIcon: ({ color }) => <PhotoIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ color }) =>
              currentPet?.species?.toLowerCase() === 'cat' ? (
                <CatProfileIcon color={color} />
              ) : (
                <DogProfileIcon color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
