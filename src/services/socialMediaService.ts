import { Linking, Alert } from "react-native"
import { ENV } from "../config/env"

const SOCIAL_MEDIA_URLS = {
  tiktok: ENV.TIKTOK_URL,
  instagram: ENV.INSTAGRAM_URL,
}

export const socialMediaService = {
  async openTikTok(): Promise<void> {
    try {
      console.log("Abriendo Tiktok...")

      const tiktokAppUrl = `tiktok://user?username=${ENV.TIKTOK_USERNAME}`
      const canOpenApp = await Linking.canOpenURL(tiktokAppUrl)

      if (canOpenApp) {
        await Linking.openURL(tiktokAppUrl)
      } else {
        await Linking.openURL(SOCIAL_MEDIA_URLS.tiktok)
      }
    } catch (error) {
      console.error("Error opening TikTok:", error)
      Alert.alert("Error", "No se pudo abrir TikTok")
    }
  },

  async openInstagram(): Promise<void> {
    try {
      console.log("Opening Instagram...")

      const instagramAppUrl = `instagram://user?username=${ENV.INSTAGRAM_USERNAME}`
      const canOpenApp = await Linking.canOpenURL(instagramAppUrl)

      if (canOpenApp) {
        await Linking.openURL(instagramAppUrl)
      } else {
        await Linking.openURL(SOCIAL_MEDIA_URLS.instagram)
      }
    } catch (error) {
      console.error("Error opening Instagram:", error)
      Alert.alert("Error", "No se pudo abrir Instagram")
    }
  },

  async openSocialMedia(platform: "tiktok" | "instagram"): Promise<void> {
    if (platform === "tiktok") {
      await this.openTikTok()
    } else if (platform === "instagram") {
      await this.openInstagram()
    }
  },
}
