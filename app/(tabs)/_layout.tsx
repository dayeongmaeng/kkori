import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import AppHeader from '../../components/AppHeader';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#E8985C',
          tabBarInactiveTintColor: '#B0A090',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#F0EAE0',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: '홈',
            tabBarIcon: () => <TabIcon emoji="🏠" />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: '포토',
            tabBarIcon: () => <TabIcon emoji="📸" />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '기록',
            tabBarIcon: () => <TabIcon emoji="📝" />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: () => <TabIcon emoji="🐾" />,
          }}
        />
      </Tabs>
    </View>
  );
}
