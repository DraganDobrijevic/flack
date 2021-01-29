import os
import requests

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit
import flask
import datetime
import time

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

name= None
timestamp = None
channelNames = []

channelMsg = {}

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/channelNames", methods=["GET"])
def channel():

    if not channelNames:
        return jsonify({"success": False})
    
    return jsonify({"success": True, "channelNames": channelNames})
     

@app.route("/check", methods=["POST"])
def check():

    newChannelName = request.form.get('channelName')

    for channelName in channelNames:
        if channelName == newChannelName:
            return jsonify({"success": False})

    channelNames.append(newChannelName)
    channelMsg[newChannelName] = []

    return jsonify({"success": True})


@socketio.on("add channel")
def addchannel(channelName):
    channelName = channelName['channelName']
    emit("publish channel", {"channelName": channelName}, broadcast=True)


@app.route("/msg", methods=["POST"])
def msg():
    # All messages from selected channel will be displayed
    name = request.form.get("name")
    # Search in channelMsg
    if name not in channelMsg:
        return jsonify({"success": False})
    return jsonify({"channelMsg": channelMsg[name], "success": True})


@socketio.on("emit_msg")
def emit_msg(msg, timestamp, name, channelName):
    emit("publish msg", {'msg': msg, 'timestamp': timestamp, 'name': name, 'channelName': channelName}, broadcast=True)


@app.route("/send_msg", methods=["POST"])
def send_msg():
    text = request.form.get("text")
    timestamp = datetime.datetime.now().strftime("%A (%d.%m.%y) at %H:%M")
    name = request.form.get("name")
    channelName = request.form.get("channelName")
    
    max100 = len(channelMsg[channelName])
    # If number of messages >= 100, delete 1 oldest
    if max100 >= 300:
        channelMsg[channelName].pop(0)
        channelMsg[channelName].pop(0)
        channelMsg[channelName].pop(0)

    # Input msg in memory
    channelMsg[channelName].append(text) 
    channelMsg[channelName].append(timestamp) 
    channelMsg[channelName].append(name) 
    return jsonify({"sendmsg": text, "timestamp": timestamp, "success": True, "max100": max100})


if __name__ == '__main__':
    socketio.run(app, debug=True)



