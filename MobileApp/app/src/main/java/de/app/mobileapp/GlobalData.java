package de.app.mobileapp;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class GlobalData {

    //Service Stuff
    public static final String BLE_SV_CR_VOLTAGE = "0000FF0A";
    public static final String BLE_SV_CR_ACCELEROMETER = "0000FF08";
    public static final String BLE_SV_CR_ACCELEROMETER_TOGGLE = "0000FF07";
    public static final String BLE_SV_CR_ACCELEROMETER_CALIBRATION = "0000FF0D";
    public static final String BLE_SV_CR_ACCELEROMETER_SETTINGS = "0000FF0E";

    public static BluetoothGattCharacteristic cr_voltage;
    public static BluetoothGattCharacteristic cr_accelerometer;
    public static BluetoothGattCharacteristic cr_accelerometer_toggle;
    public static BluetoothGattCharacteristic cr_accelerometer_calibration;
    public static BluetoothGattCharacteristic cr_accelerometer_settings;
    //

    //public static final double[] VOLTAGE_LUT = new double[]{4.2, 4.13, 4.06, 3.99, 3.92, 3.85, 3.78, 3.71, 3.64, 3.57, 3.5};
    public static final double[] VOLTAGE_LUT = new double[]{4.2, 4.05, 3.95, 3.88, 3.80, 3.78, 3.73, 3.70, 3.65, 3.57, 3.0};

    public static final int CONNECTION_STATUS_OFFLINE = 0;
    public static final int CONNECTION_STATUS_CONNECTED = 1;
    //


    public static short ACC_OFFSET_X = 0, ACC_OFFSET_Y = 0,ACC_OFFSET_Z = 0;
    public static float GYR_OFFSET_X = 0, GYR_OFFSET_Y = 0,GYR_OFFSET_Z = 0;
    public static float ACC_TOTAL_CALIBRATION_OFFSET = 0f;

    private static final int REQUEST_ENABLE_BT = 1;
    private static final long SCAN_PERIOD = 30000;

    private static Handler handler;
    private static Handler mainHandler;

    public static boolean forceStop;
    private static float battery_voltage = 0.0f;
    private static double[] battery_voltage_delta = new double[]{0.0, 0.0f};

    public static boolean battery_charging = false;
    public static float totalAcceleration = 0.0f;
    public static int rotationsSinceLaunch = 0;

    public static float ROT_X = 0, ROT_Y = 0, ROT_Z = 0;
    public static float ROTS_X = 0, ROTS_Y = 0, ROTS_Z = 0;
    public static float ROTATION_DELTA_THRESHOLD = 25.0f;
    public static long ROT_T0 = 0;

    public static RotationCallback rotCallback;

    public static boolean generateFakeSensorValues = false;
    public static boolean showFullGraph = false;
    public static boolean pauseDataCollection = false;


    public static Context currentContext;

    public static BluetoothAdapter bluetoothAdapter;
    public static boolean bt_scanning = false;

    public static BluetoothLeScanner leScanner;

    public static BluetoothGatt bluetoothGatt;

    public static int connection_status = CONNECTION_STATUS_OFFLINE;


    public static List<BluetoothDevice> list_devices = new ArrayList<>();
    private static BTScanCallback callback;

    private static ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            //Log("Dev: "+result.getDevice().getAddress());
            if(!list_devices.contains(result.getDevice())) {
                list_devices.add(result.getDevice());
                if (callback != null)
                    callback.addDevice(result.getDevice());
            }
            else{
                if (callback != null)
                    callback.updateDevice(result.getDevice());
            }
        }
    };


    public static void readLogcat(AppCompatActivity act){
        Process logcat;
        final StringBuilder log = new StringBuilder();
        try {
            logcat = Runtime.getRuntime().exec(new String[]{"logcat", "-d"});
            BufferedReader br = new BufferedReader(new InputStreamReader(logcat.getInputStream()),4*1024);
            String line;
            String separator = System.getProperty("line.separator");

            TextView tv_log = act.findViewById(R.id.tv_log);
            tv_log.setTextColor(Style.COLOR_WHITE);
            tv_log.setVerticalScrollBarEnabled(true);
            tv_log.setMovementMethod(new ScrollingMovementMethod());
            tv_log.setText("Log:\n");

            while ((line = br.readLine()) != null) {
                tv_log.setText(tv_log.getText() + line + separator);
            }

            Log("Finished Logcat read");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void Log(String text){
        if(mainHandler==null){
            mainHandler = new Handler(Looper.getMainLooper()){
                @Override
                public void handleMessage(@NonNull Message msg) {
                    Toast toast = Toast.makeText(currentContext, (String)msg.obj, Toast.LENGTH_SHORT);
                    toast.show();
                }
            };
        }

        if(currentContext!=null) {
            Message msg = mainHandler.obtainMessage();
            msg.obj = text;
            msg.setTarget(mainHandler);
            msg.sendToTarget();

            Log.d("<Global Log>", text);
        }
    }

    public static void checkBTEnabled(AppCompatActivity act){
        bluetoothAdapter = ((BluetoothManager)act.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            act.startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);

            Log("Enable BT");
        }
        else if(bluetoothAdapter==null){
            Log("No Bluetooth Adapter found");
        }
        else{
            Log("Bluetooth Adapter found " + bluetoothAdapter.getName());
        }

        if(ContextCompat.checkSelfPermission(act, Manifest.permission.ACCESS_FINE_LOCATION)!= PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(act, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log("No Permissions granted!!!");

            ActivityCompat.requestPermissions(act, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, 0);
        }
    }

    public static void scanBTDevices(BTScanCallback callback){
        bluetoothAdapter = ((BluetoothManager)currentContext.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();
        leScanner = bluetoothAdapter.getBluetoothLeScanner();

        if(leScanner==null){
            Log("No LE Scanner found!!!");
            return;
        }
        if(handler==null){
            handler = new Handler();
        }

        GlobalData.callback = callback;

        if(!bt_scanning){
            Log("Start Scanning...");
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    stopScan();
                }
            }, SCAN_PERIOD);

            bt_scanning = true;
            list_devices.clear();
            leScanner.startScan(scanCallback);
        }
        else{
            stopScan();
        }
    }

    public static void stopScan(){
        Log("Stopped Scanning...");

        leScanner.stopScan(scanCallback);
        bt_scanning = false;
    }

    public static void readBatteryVoltage(){
        if(bluetoothGatt!=null && cr_voltage!=null){
            bluetoothGatt.readCharacteristic(cr_voltage);
        }
    }
    public static void readIMUCalibration(){
        if(bluetoothGatt!=null && cr_accelerometer_calibration!=null){
            bluetoothGatt.readCharacteristic(cr_accelerometer_calibration);
        }
    }

    public static void startIMU(){
        if(bluetoothGatt!=null && cr_accelerometer_toggle!=null){
            cr_accelerometer_toggle.setValue(new byte[]{0x53, 0x35, 0x02, 0x01, 0x32});
            bluetoothGatt.writeCharacteristic(cr_accelerometer_toggle);
        }
    }
    public static void stopIMU(){
        if(bluetoothGatt!=null && cr_accelerometer_toggle!=null){
            cr_accelerometer_toggle.setValue(new byte[]{0x53, 0x02, 0x02, 0x0, 0x0});
            bluetoothGatt.writeCharacteristic(cr_accelerometer_toggle);
        }
    }

    public static void readIMU(){
        if(bluetoothGatt!=null && cr_accelerometer!=null){
            bluetoothGatt.readCharacteristic(cr_accelerometer);
        }
    }

    public static void writeSettings(){
        cr_accelerometer_settings.setValue(new byte[]{0x59, 0x20, 0x04, 0x06, 0x08, 0x08, 0x06});
        bluetoothGatt.writeCharacteristic(cr_accelerometer_settings);
    }

    public static void updateRotation(float rx, float ry, float rz){
        float dx = rx - ROT_X;
        float dy = ry - ROT_Y;
        float dz = rz - ROT_Z;

        float dx2 = dx*dx;
        float dy2 = dy*dy;
        float dz2 = dz*dz;

        float total = (float)Math.sqrt(dx2 + dy2 + dz2);

        if(total > ROTATION_DELTA_THRESHOLD){
            //TODO notify
            if(rotCallback!=null)
                rotCallback.rotationHappened(total, rx, ry, rz);

            ROT_X = rx;
            ROT_Y = ry;
            ROT_Z = rz;

            ++rotationsSinceLaunch;
        }

    }
    public static void updateRotationSpeed(float rx, float ry, float rz){
        long t1 = System.currentTimeMillis();
        double dt = (t1 - ROT_T0) * 0.001;

        ROT_T0 = t1;

        ROT_X += rx * dt;
        ROT_Y += ry * dt;
        ROT_Z += rz * dt;

        double dx2 = ROT_X*ROT_X;
        double dy2 = ROT_Y*ROT_Y;
        double dz2 = ROT_Z*ROT_Z;

        float total = (float)Math.sqrt(dx2 + dy2 + dz2);

        if(total > ROTATION_DELTA_THRESHOLD && total < 1000){
            if(rotCallback!=null)
                rotCallback.rotationHappened(total, rx, ry, rz);

            ROT_X = 0;
            ROT_Y = 0;
            ROT_Z = 0;

            ++rotationsSinceLaunch;
        }

        ROTS_X = rx;
        ROTS_Y = ry;
        ROTS_Z = rz;
    }

    public static short toShort(byte a, byte b){
        return ByteBuffer.wrap(new byte[]{a, b}).order(ByteOrder.LITTLE_ENDIAN).getShort();
    }

    public static double voltageToPercentage(double voltage){
        /*
        double a = 0;
        double b = VOLTAGE_LUT[0];
        int i;
        for(i=1; i<11 && voltage < b; ++i){
            a = b;
            b = VOLTAGE_LUT[i];
        }
        double percentageBase = 100.0 - 10.0 * (i - 1);
        double d = (voltage - b) / (a - b);
        //double fr = d - Math.floor(d);

        return Math.min(Math.max(0.0, percentageBase + 10.0 * d), 100.0);*/

        //fit function
        return 109.3804 + (0.7238402 - 109.3804)/Math.pow(1.0 + Math.pow(voltage/3.646031, 59.49707),0.2810954);
    }


    public static void setBattery_voltage(float voltage){
        double t1 = System.currentTimeMillis() * 0.001;
        double d0 = (voltageToPercentage(voltage) - voltageToPercentage(battery_voltage)) / (t1 - battery_voltage_delta[1]);

        battery_voltage_delta[0] = (-voltageToPercentage(voltage) / d0);
        battery_voltage_delta[1] = t1;

        battery_voltage = voltage;
    }

    public static float getBattery_voltage(){
        return battery_voltage;
    }

    public static double getBattery_drain_estimation() {
        return battery_voltage_delta[0];
    }

    interface RotationCallback{
        void rotationHappened(float total, float rx, float ry, float rz);
    }


}
