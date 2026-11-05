import { TextStyle } from "react-native/Libraries/StyleSheet/StyleSheetTypes";

export const COLORS ={
    primary : "#0D9488",
    navy : "#0F1F3D",
    blue : "#1E5AA8",
    border : "#BFC7D1",
    BGCOLOR : "#F3F6FA",
    greenCamera : "#009846",
    orangeCamera : "#ef7f1a",
    blueCamera : "#008dd2",
    yellowCamera : "#fecc00",
}


//ÇOK tekrarlanan TextInput Stili
export const INPUT_STYLE: TextStyle = {
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  backgroundColor: "white",
};