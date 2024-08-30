import 'package:flutter/material.dart';
import 'package:sensors/sensors.dart';
import 'package:http/http.dart' as http;

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  AccelerometerEvent? _lastEvent;
  DateTime? _lastShakeTime;

  @override
  void initState() {
    super.initState();
    accelerometerEvents.listen((AccelerometerEvent event) {
      setState(() {
        _lastEvent = event;
      });
      if (_isShaking(event)) {
        _handleShake();
      }
    });
  }

  bool _isShaking(AccelerometerEvent event) {
    const double threshold = 12.0;
    double totalForce = event.x + event.y + event.z;
    return totalForce.abs() > threshold;
  }

  void _handleShake() {
    if (_lastShakeTime == null ||
        DateTime.now().difference(_lastShakeTime!) > Duration(seconds: 5)) {
      _lastShakeTime = DateTime.now();
      _sendAlert();
    }
  }

  void _sendAlert() async {
    const String apiUrl = 'https://your-backend-server.com/alert';
    try {
      final response = await http.post(Uri.parse(apiUrl), body: {
        'userId': 'user123', // Replace with actual user ID
        'message': 'Emergency alert triggered!',
      });
      if (response.statusCode == 200) {
        print('Alert sent successfully');
      } else {
        print('Failed to send alert');
      }
    } catch (e) {
      print('Error sending alert: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Women Safety App'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'Shake your device to trigger alert',
            ),
            if (_lastEvent != null)
              Text(
                'Last event: ${_lastEvent!.x}, ${_lastEvent!.y}, ${_lastEvent!.z}',
              ),
          ],
        ),
      ),
    );
  }
}