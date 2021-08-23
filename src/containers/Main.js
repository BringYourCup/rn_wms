import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import { converseExcelData } from 'utils/converseExcel'

export default class Main extends Component {

  state = {
    items: [
      { title: "쿠팡", fileName: "" },
      { title: "11번가", fileName: "" },
      { title: "위메프", fileName: "" },
    ],
    loading: false
  }

  deleteItem = (i) => {
    let newItems = [...this.state.items]
    newItems[i]["fileName"] = ""
    delete (newItems[i].fileUri)
    console.log("newItems : ", newItems)
    this.setState({ items: newItems })
  }
  pickFile = async (i) => {
    console.log("i : ", i)
    let newItems = [...this.state.items]
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
      })

      console.log(
        res.uri,
        res.type, // mime type
        res.name,
        res.size,
      )
      newItems[i]["fileName"] = res.name
      newItems[i]["fileUri"] = res.uri
      this.setState({ items: newItems })
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err
      }
    }
  }

  renderItem = () => {
    const { items } = this.state;
    return items.map((item, i) => {
      return (
        <View key={i.toString()} style={styles.item}>
          <Text>{item.title}</Text>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <View style={{ flex: 8, borderWidth: 1, borderColor: "grey", height: 40, alignItems: "center", flexDirection: "row", backgroundColor: "white" }}>
              <Text style={{ flex: 9, fontSize: 12, includeFontPadding: false, textAlignVertical: "center" }} numberOfLines={1}>
                {item.fileName}
              </Text>
              <TouchableOpacity style={{ flex: 0.5 }}
                onPress={() => this.deleteItem(i)}
              >
                <Text style={{ color: "grey" }}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 2, marginLeft: 10 }}>
              <TouchableOpacity style={{ borderWidth: 1, borderColor: "grey", height: 40, borderRadius: 5, justifyContent: "center", alignItems: "center", backgroundColor: "#2e363e" }}
                onPress={() => { this.pickFile(i) }}
              >
                <Text style={{ color: "white" }}>파일열기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    })
  }

  converse = async () => {
    let flag = false
    this.state.items.forEach(item => {
      if (item.hasOwnProperty("fileUri")) {
        flag = true;
      }
    })
    if (flag === false) {
      alert("한 개이상의 파일을 선택해 주세요.")
      return;
    }

    console.log("converse start")
    this.setState({ loading: true })
    await converseExcelData(this.state.items)
    console.log("converse end")
    setTimeout(() => {
      this.setState({ loading: false })
      alert("변환 완료(AGROUND_WMS 디렉터리 참조")
    }, 3000);
  }

  render() {
    const { loading } = this.state;
    return (
      <View style={styles.container}>

        {loading &&
          <View style={{ ...StyleSheet.absoluteFillObject, position: "absolute", height: "100%", width: "100%", zIndex: 100, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator
              size={"large"}
              color={"grey"} />
          </View>
        }
        <View style={styles.header}>
          <Text style={{ color: "#2e363e", fontSize: 16 }}>{"WMS 파일 변환 프로그램"}</Text>
        </View>
        <View style={styles.body}>
          {this.renderItem()}
        </View>
        <View style={styles.footer}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
            <TouchableOpacity style={{
              borderWidth: 1, borderColor: "grey", height: 40, width: 80, borderRadius: 5, justifyContent: "center", alignItems: "center", backgroundColor: "#2e363e"
            }}
              onPress={this.converse}
            >
              <Text style={{ color: "white" }}>변환</Text>
            </TouchableOpacity>
            {/*<TouchableOpacity style={{ marginLeft: 10, borderWidth: 1, borderColor: "grey", height: 40, width: 80, borderRadius: 5, justifyContent: "center", alignItems: "center", backgroundColor: "#2e363e" }}>
              <Text style={{ color: "white" }}>설정</Text>
          </TouchableOpacity>*/}
          </View>
        </View>
      </View>
    )
  }
}





const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffe812"
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    height: 30,
  },
  body: {
    flex: 1,

  },
  item: {
    height: 80,
    padding: 10
  },
  footer: {
    height: 50
  }
})