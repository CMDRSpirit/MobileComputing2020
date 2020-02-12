package de.app.mobileapp;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.jjoe64.graphview.GraphView;
import com.jjoe64.graphview.series.DataPoint;
import com.jjoe64.graphview.series.LineGraphSeries;

import java.util.Map;

public class MainActivity extends AppCompatActivity implements Style {

    LineGraphSeries<DataPoint> series_voltage, series_movement;

    private float graph_movement_value = 0.0f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        GlobalData.currentContext = this;

        /*try{
            Runtime.getRuntime().exec(new String[]{"logcat", "-c"});
        } catch (Exception e) {
            e.printStackTrace();
        }*/

        //
        findViewById(R.id.layout_base).setBackgroundColor(COLOR_DARK_1);
        //findViewById(R.id.iv_settings).setBackgroundColor(COLOR_DARK_2);

        TextView tv_bat_status = findViewById(R.id.tv_bat_status);
        //tv_bat_status.setBackgroundColor(COLOR_DARK_2);
        tv_bat_status.setTextColor(COLOR_WHITE);
        TextView tv_move_count = findViewById(R.id.tv_move_count);
        //tv_move_count.setBackgroundColor(COLOR_DARK_2);
        tv_move_count.setTextColor(COLOR_WHITE);
        //

        GraphView graph = findViewById(R.id.gr_bat_vol);

        //graph.setBackgroundColor(COLOR_DARK_2);
        graph.getViewport().setBorderColor(COLOR_WHITE);
        graph.getGridLabelRenderer().setGridColor(COLOR_GREY_1);
        graph.getGridLabelRenderer().setHorizontalAxisTitleColor(COLOR_WHITE);
        graph.getGridLabelRenderer().setVerticalAxisTitleColor(COLOR_WHITE);
        graph.getGridLabelRenderer().setHorizontalLabelsColor(COLOR_WHITE);
        graph.getGridLabelRenderer().setVerticalLabelsColor(COLOR_WHITE);
        graph.setTitle("Battery Voltage");
        graph.setTitleColor(COLOR_WHITE);

        graph.getGridLabelRenderer().setHorizontalAxisTitle("Time (s)");
        graph.getGridLabelRenderer().setHorizontalAxisTitleColor(COLOR_WHITE);
        graph.getGridLabelRenderer().setVerticalAxisTitle("V");
        graph.getGridLabelRenderer().setVerticalAxisTitleColor(COLOR_WHITE);

        series_voltage = new LineGraphSeries<>();
        //for(int i=0;i<14;++i){
        //    series.appendData(new DataPoint(i, (1 - i / 14.0) * 1.2f), false, 14);
        //}
        graph.addSeries(series_voltage);
        series_voltage.setColor(COLOR_WHITE);



        graph.getViewport().setXAxisBoundsManual(true);
        graph.getViewport().setMinX(0.0);
        graph.getViewport().setMaxX(10.0);
        graph.getViewport().setYAxisBoundsManual(true);
        graph.getViewport().setMinY(0.0);
        graph.getViewport().setMaxY(2.0);

        graph.getViewport().setScalable(true);
        graph.getViewport().setScrollableY(true);

        //
        GraphView graph_movement = findViewById(R.id.gr_movement);
        //graph_movement.setBackgroundColor(COLOR_DARK_2);
        graph_movement.getGridLabelRenderer().setGridColor(COLOR_GREY_1);
        graph_movement.getGridLabelRenderer().setHorizontalAxisTitleColor(COLOR_WHITE);
        graph_movement.getGridLabelRenderer().setVerticalAxisTitleColor(COLOR_WHITE);
        graph_movement.getGridLabelRenderer().setHorizontalLabelsColor(COLOR_WHITE);
        graph_movement.getGridLabelRenderer().setVerticalLabelsColor(COLOR_WHITE);
        graph_movement.setTitle("Movement");
        graph_movement.setTitleColor(COLOR_WHITE);

        graph_movement.getGridLabelRenderer().setHorizontalAxisTitle("Time (s)");
        graph_movement.getGridLabelRenderer().setHorizontalAxisTitleColor(COLOR_WHITE);
        graph_movement.getGridLabelRenderer().setVerticalAxisTitle("Deg");
        graph_movement.getGridLabelRenderer().setVerticalAxisTitleColor(COLOR_WHITE);

        series_movement = new LineGraphSeries<>();
        graph_movement.addSeries(series_movement);
        series_movement.setColor(Color.WHITE);

        graph_movement.getViewport().setXAxisBoundsManual(true);
        graph_movement.getViewport().setMinX(0.0);
        graph_movement.getViewport().setMaxX(10.0);
        graph_movement.getViewport().setYAxisBoundsManual(true);
        graph_movement.getViewport().setMinY(0.0);
        graph_movement.getViewport().setMaxY(2.0);

        graph_movement.getViewport().setScalable(true);
        graph_movement.getViewport().setScrollableY(true);

        GlobalData.rotCallback = new GlobalData.RotationCallback() {
            @Override
            public void rotationHappened(float total, float rx, float ry, float rz) {
                GlobalData.totalAcceleration = total;
            }
        };

        Handler seriesAdder = new Handler(Looper.getMainLooper()){
            @Override
            public void handleMessage(@NonNull Message msg) {
                if(msg.obj.getClass() == AddDatapointMsg.class) {
                    series_voltage.appendData(((AddDatapointMsg) msg.obj).voltage, true, 10000);
                    series_movement.appendData(((AddDatapointMsg) msg.obj).movement, true, 10000);

                    if (GlobalData.showFullGraph) {
                        graph.getViewport().setMinX(series_voltage.getLowestValueX());
                        graph.getViewport().setMaxX(((AddDatapointMsg) msg.obj).voltage.getX());

                        graph_movement.getViewport().setMinX(series_movement.getLowestValueX());
                        graph_movement.getViewport().setMaxX(((AddDatapointMsg) msg.obj).movement.getX());
                    }
                }
                else if(msg.obj.getClass() == SetTextMessage.class) {
                    if(((SetTextMessage)msg.obj).vt != null)
                        ((SetTextMessage)msg.obj).vt.setText(((SetTextMessage)msg.obj).text);
                }
            }
        };

        //TODO remove
        final long t0 = System.currentTimeMillis();
        new Thread(new Runnable() {
            @Override
            public void run() {
                while(!Thread.currentThread().isInterrupted() && !GlobalData.forceStop){
                    graph.getViewport().setMaxY(series_voltage.getHighestValueY() + 0.1);
                    graph.getViewport().setMinY(series_voltage.getLowestValueY() - 0.1);

                    graph_movement.getViewport().setMaxY(series_movement.getHighestValueY() + 0.1);
                    graph_movement.getViewport().setMinY(series_movement.getLowestValueY() - 0.1);

                    //series_voltage.appendData(new DataPoint((System.currentTimeMillis() - t0)*0.001f, GlobalData.battery_voltage), true, 100);
                    //series_movement.appendData(new DataPoint((System.currentTimeMillis() - t0)*0.001f, GlobalData.totalAcceleration), true, 100);

                    if(!GlobalData.pauseDataCollection) {
                        if (GlobalData.connection_status == GlobalData.CONNECTION_STATUS_CONNECTED || GlobalData.generateFakeSensorValues) {
                            graph.setTitle("Battery Voltage [" + String.format("%.3f", GlobalData.getBattery_voltage()) + " V]");
                            graph_movement.setTitle("Movement [" + String.format("%.1f", GlobalData.totalAcceleration) + " deg]");

                            Message msg = seriesAdder.obtainMessage();
                            msg.obj = new AddDatapointMsg(new DataPoint((System.currentTimeMillis() - t0) * 0.001f, GlobalData.getBattery_voltage()), new DataPoint((System.currentTimeMillis() - t0) * 0.001f, graph_movement_value));
                            msg.setTarget(seriesAdder);
                            msg.sendToTarget();
                        } else {
                            graph.setTitle("Battery Voltage not available");
                            graph_movement.setTitle("Movement not available");
                        }
                        if (GlobalData.connection_status != GlobalData.CONNECTION_STATUS_CONNECTED && GlobalData.generateFakeSensorValues && Math.random() < 0.1) {
                            //GlobalData.battery_voltage = (float) (3.5 + Math.random() * 0.7);
                            GlobalData.setBattery_voltage((float) (3.5 + 0.7 * Math.exp(-0.01 * Math.max(0.0, (System.currentTimeMillis() - t0) * 0.001 - 10))));
                            //GlobalData.totalAcceleration = (float)(Math.random());

                            GlobalData.updateRotation((float) ((Math.random() - 0.5) * 180.0), (float) ((Math.random() - 0.5) * 180.0), (float) ((Math.random() - 0.5) * 180.0));
                        }
                    }
                    else{
                        graph.setTitle("Battery Voltage not available");
                        graph_movement.setTitle("Movement not available");
                    }

                    //GlobalData.totalAcceleration *= 0.5;
                    graph_movement_value = graph_movement_value * 0.2f + 0.8f * GlobalData.totalAcceleration;
                    if(Math.abs(graph_movement_value - GlobalData.totalAcceleration) < 1.0){
                        GlobalData.totalAcceleration = 0.0f;
                    }


                    try{
                        Thread.sleep(100);
                    } catch(Exception e){

                    }
                }
            }
        }).start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                while(!Thread.currentThread().isInterrupted() && !GlobalData.forceStop){
                    /*
                    if (GlobalData.connection_status == GlobalData.CONNECTION_STATUS_CONNECTED || GlobalData.generateFakeSensorValues) {
                        tv_bat_status.setText("Battery status: " + String.format("%.1f", GlobalData.voltageToPercentage(GlobalData.battery_voltage)) + "% " + (GlobalData.battery_charging ? "charging" : "discharging"));
                        tv_move_count.setText("Rotations since launch: " + GlobalData.rotationsSinceLaunch);
                    }
                    else{
                        tv_bat_status.setText("Battery status: NA");
                        tv_move_count.setText("Rotations since launch: NA");
                    }*/

                    //double timeToDepletion = -GlobalData.voltageToPercentage(GlobalData.getBattery_voltage()) / (GlobalData.voltageToPercentage(GlobalData.getBattery_voltage()) - GlobalData.voltageToPercentage(GlobalData.getBattery_voltage() - GlobalData.getBattery_voltage_delta()));

                    Message msg = seriesAdder.obtainMessage();
                    msg.obj = new SetTextMessage((GlobalData.connection_status == GlobalData.CONNECTION_STATUS_CONNECTED  || GlobalData.generateFakeSensorValues) ? ("Battery status: " + String.format("%.1f", GlobalData.voltageToPercentage(GlobalData.getBattery_voltage())) + "% " + (GlobalData.battery_charging ? "charging" : "discharging - " + String.format("%.1f", GlobalData.getBattery_drain_estimation() / 60.0)+ " min left")) : "Battery status: NA", tv_bat_status);
                    msg.setTarget(seriesAdder);
                    msg.sendToTarget();

                    msg = seriesAdder.obtainMessage();
                    msg.obj = new SetTextMessage((GlobalData.connection_status == GlobalData.CONNECTION_STATUS_CONNECTED  || GlobalData.generateFakeSensorValues) ? ("Rotations since launch: " + GlobalData.rotationsSinceLaunch) : "Rotations since launch: NA", tv_move_count);
                    msg.setTarget(seriesAdder);
                    msg.sendToTarget();

                    try{
                        Thread.sleep(100);
                    } catch(Exception e){

                    }
                }
            }
        }).start();
        //

        //
        ImageView view_settings = findViewById(R.id.iv_settings);
        view_settings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, SettingsActivity.class));
            }
        });



        //
        GlobalData.checkBTEnabled(this);
        //graph.setTitle(""+GlobalData.bluetoothAdapter);
        //graph_movement.setTitle(""+GlobalData.leScanner);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        GlobalData.stopIMU();

        GlobalData.forceStop = true;
        if(GlobalData.bluetoothGatt!=null) GlobalData.bluetoothGatt.close();
    }

    class SetTextMessage{
        String text;
        TextView vt;

        public SetTextMessage(String text, TextView vt) {
            this.text = text;
            this.vt = vt;
        }
    }

    class AddDatapointMsg{
        DataPoint voltage;
        DataPoint movement;

        public AddDatapointMsg(DataPoint voltage, DataPoint movement) {
            this.voltage = voltage;
            this.movement = movement;
        }
    }
}
