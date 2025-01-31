import React, { Component } from 'react';
import AceEditor from 'react-ace';
import {globalState} from '../state';

import 'ace-builds/src-noconflict/mode-yaml'
import 'ace-builds/src-noconflict/theme-monokai'

export default class GuildConfigEdit extends Component {
    constructor() {
        super();

        this.messageTimer = null;
        this.initialConfig = null;

        this.state = {
            message: null,
            guild: null,
            contents: null,
            hasUnsavedChanges: false,
        }
    }

    componentDidMount() {
        globalState.getGuild(this.props.match.params.gid).then((guild) => {
            globalState.currentGuild = guild;

            guild.getConfig(true).then((config) => {
                this.initialConfig = config.contents;

                this.setState({
                    guild: guild,
                    contents: config.contents,
                });
            });
        }).catch((err) => {
            console.error('Failed to find guild for config edit', this.props.match.params.gid);
        });
    }

    componentWillUnmount() {
        globalState.currentGuild = null;
    }

    onEditorChange(newValue) {
        let newState = {contents: newValue, hasUnsavedChanges: false};
        if (this.initialConfig != newValue) {
            newState.hasUnsavedChanges = true;
        }
        this.setState(newState);
    }

    onSave() {
        this.state.guild.putConfig(this.state.contents).then(() => {
            this.initialConfig = this.state.contents;
            this.setState({
                hasUnsavedChanges: false,
            });
            this.renderMessage('success', 'Saved Configuration!');
        }).catch((err) => {
            this.renderMessage('danger', `Failed to save configuration: ${err}`);
        });
    }

    renderMessage(type, contents) {
        this.setState({
            message: {
                type: type,
                contents: contents,
            }
        })

        if (this.messageTimer) clearTimeout(this.messageTimer);

        this.messageTimer = setTimeout(() => {
            this.setState({
                message: null,
            });
            this.messageTimer = null;
        }, 5000);
    }

    render() {
        return (<div>
            {this.state.message && <div className={'alert alert-' + this.state.message.type}>{this.state.message.contents}</div>}
            <div className='card'>
                <div className='card-header'>
                    Configuration Editor
                </div>
                <div className='card-body'>
                    <AceEditor
                        mode='yaml'
                        theme='monokai'
                        width='100%'
                        height='75vh'
                        value={this.state.contents == null ? '' : this.state.contents}
                        onChange={(newValue) => this.onEditorChange(newValue)}
                    />
                </div>
                <div className='card-footer'>
                    {
                        this.state.guild && this.state.guild.role != 'viewer' &&
                        <button onClick={() => this.onSave()} type='button' className='btn btn-success btn-circle btn-lg'>
                            <i className='fa fa-check'></i>
                        </button>
                    }
                    { this.state.hasUnsavedChanges && <i style={{paddingLeft: '10px'}}>Unsaved Changes!</i>}
                </div>
            </div>
        </div>);
    }
}

