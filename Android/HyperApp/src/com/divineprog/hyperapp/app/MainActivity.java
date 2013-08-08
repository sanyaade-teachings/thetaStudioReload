package com.divineprog.hyperapp.app;

import com.divineprog.hyperapp.app.R;
import com.divineprog.hyperapp.Input;
import com.divineprog.hyperapp.InputActivity;
import com.divineprog.hyperapp.JavaScriptWebView;

import android.os.Bundle;
import android.app.Activity;
import android.content.res.Configuration;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.webkit.ConsoleMessage;

public class MainActivity
    extends InputActivity
    implements JavaScriptWebView.ConsoleListener
{
    JavaScriptWebView mWebView;
    String mHomePageUrl = "file:///android_asset/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        // Create WebView.
        mWebView = new JavaScriptWebView(this);
        mWebView.setConsoleListener(this);
        mWebView.loadUrl(mHomePageUrl);
        //mWebView.loadUrl("http://192.168.43.226:4042/connect");
        setContentView(mWebView);
        createInputListener();
    }

    /**
     * Handle back key.
     */
    void createInputListener()
    {
        addInputListener(new Input.Adapter()
        {
            @Override
            public boolean onKeyUp(int keyCode)
            {
                if (KeyEvent.KEYCODE_BACK == keyCode)
                {
                    if (mWebView.getUrl().equals(mHomePageUrl))
                    {
                        // If on home page then exit app.
                        finish();
                    }
                    else
                    {
                        // Otherwise show app home page.
                        mWebView.loadUrl(mHomePageUrl);
                    }
                    return true;
                }
                else
                {
                    return false;
                }
            }
        });
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
