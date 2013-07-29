package com.divineprog.hyperapp.app;

import com.divineprog.hyperapp.app.R;
import com.divineprog.hyperapp.JavaScriptWebView;

import android.os.Bundle;
import android.app.Activity;
import android.content.res.Configuration;
import android.util.Log;
import android.view.Menu;
import android.webkit.ConsoleMessage;

public class MainActivity
    extends Activity
    implements JavaScriptWebView.ConsoleListener
{
    JavaScriptWebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        mWebView = new JavaScriptWebView(this);
        mWebView.setConsoleListener(this);
        mWebView.loadUrl("file:///android_asset/index.html");
        //mWebView.loadUrl("http://192.168.43.226:4042/connect");
        setContentView(mWebView);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu)
    {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig)
    {
        super.onConfigurationChanged(newConfig);
        /*
        // Checks the orientation of the screen
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            Toast.makeText(this, "landscape", Toast.LENGTH_SHORT).show();
        } else if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT){
            Toast.makeText(this, "portrait", Toast.LENGTH_SHORT).show();
        }
        */
    }

    @Override
    public void onConsoleMessage(ConsoleMessage message)
    {
        int pos = message.sourceId().lastIndexOf("/");
        String file = message.sourceId().substring(pos + 1);
        String msg =
            message.message() + " [" + file + ":" +  message.lineNumber() + "]";
        mWebView.callJS(
            "try{hyperapp.nativeConsoleMessageCallBack('"
            + msg
            + "')}catch(err){}");
        Log.i("@@@", msg);
    }
}
