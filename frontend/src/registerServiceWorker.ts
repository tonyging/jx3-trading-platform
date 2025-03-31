// src/registerServiceWorker.ts
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  } else {
    console.warn('Push notifications are not supported in this browser')
    return null
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('User has denied notification permission')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

// 訂閱推播通知
export async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    })

    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

// 將 base64 編碼的 VAPID 公鑰轉換為 Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
