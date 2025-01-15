<template>
  <div v-if="!loading">
    <BackTo />
    <EntityHeader
      :name="entityName"
      :businessNumber="entityBusinessNumber"
      :jurisdiction="entityJurisdiction"
      :state="entityState"
      class="mb-2"
    />
    <v-tabs v-model="currentTab" slider-size="5px">
      <v-tab
        v-for="(item, i) in tabItems"
        :key="i"
        :ripple="false"
        active-class="tab-active"
        @click="tabClick(item.refname)"
        class="text-capitalize"
        >{{ item.text }}</v-tab
      >
    </v-tabs>
    <v-divider></v-divider>
    <v-row>
      <v-col
        :class="{
          'pa-0 pt-2 pb-4': true,
          'text-right': $vuetify.breakpoint.smAndUp,
        }"
        ><span
          class="text-body-2 show-all-statuses vertical-align-middle"
          @click="toggleCredentialsExpanded"
          >Show all Credential statuses</span
        ></v-col
      >
    </v-row>

    <!-- topic -->
    <EntityCard ref="registration" :expanded="credentialsExpanded">
      <template #expansionPanels>
        <CredentialItem
          :entityType="entityJurisdiction"
          :authority="entityRegistrationIssuer"
          :authorityLink="entityRegistrationIssuerUrl"
          :effectiveDate="entityStatusEffectiveDate"
          :credId="entityNameCredId"
        >
          <template #header>
            <div class="text-h6 font-weight-bold">Registration</div>
          </template>
        </CredentialItem>
      </template>
      <template #content>
        <div class="pa-5 pt-2">
          <div class="mb-6 text-body-2">
            <span>{{ entityName }}</span>
            <span>&nbsp;is a&nbsp;</span>
            <Dialog>
              <template #activator
                ><span class="fake-link" v-t="entityJurisdiction"></span>
                <v-icon small class="fake-link mx-1">{{
                  mdiInformationOutline
                }}</v-icon>
              </template>
              <template #content>
                <div v-html="entityDesc.html"></div>
              </template>
            </Dialog>
          </div>
          <div class="text-body-2">
            <div>
              {{
                `${entityTypeToRegValue(
                  $t(entityJurisdiction)
                )}: ${entityIncorporationNumber} `
              }}
            </div>
            <div>Registered on: {{ entityRegistrationDate | formatDate }}</div>
            <div>
              Business name effective:
              {{ entityNameEffectiveDate | formatDate }}
            </div>
          </div>
        </div>
      </template>
    </EntityCard>

    <!-- relationships related to -->
    <EntityCard
      ref="relationships"
      :expanded="credentialsExpanded"
      v-if="businessAsRelationship.length > 0"
    >
      <template #title>
        <div class="flex">
          <Dialog>
            <template #activator>
              <span
                class="fake-link text--primary"
                style="text-decoration: none"
              >
                Relationships
                <v-icon class="icon-dense" dense>{{
                  mdiInformationOutline
                }}</v-icon>
              </span>
            </template>
            <template #content>
              <h3>Relationships:</h3>
              <p>
                The organizational connections between this credential and other
                credentials. An example relationship in OrgBook BC is one
                registered organization “Doing Business As” another.
              </p>
            </template>
          </Dialog>
        </div>
      </template>
      <template #subtitle>
        <div class="px-5 mb-n2 text-body-2">
          <p>{{ entityName }} is doing business as:</p>
        </div>
      </template>
      <template #expansionPanels>
        <CredentialItem
          v-for="(_, i) in Math.min(
            businessAsRelationship.length - relationshipStartIndex,
            itemsDisplayed
          )"
          :key="i"
          :entityType="entityJurisdiction"
          :expired="
            businessAsRelationship[i + relationshipStartIndex].credential
              .revoked
          "
          :authority="
            credOrRelationshipToDisplay(
              businessAsRelationship[i + relationshipStartIndex],
              credSet
            ).authority
          "
          :authorityLink="
            credOrRelationshipToDisplay(
              businessAsRelationship[i + relationshipStartIndex],
              credSet
            ).authorityLink
          "
          :effectiveDate="
            businessAsRelationship[i + relationshipStartIndex].credential
              .effective_date
          "
          :credId="
            businessAsRelationship[i + relationshipStartIndex].credential.id
          "
        >
          <template #header>
            <div>
              <span
                v-if="
                  businessAsRelationship[i + relationshipStartIndex].credential
                    .revoked
                "
                class="expired-credential"
              >
                <v-icon>{{ mdiCircleMedium }}</v-icon>
                Credential replaced:
                {{
                  businessAsRelationship[i + relationshipStartIndex].credential
                    .revoked_date | formatDate
                }}
              </span>

              <v-icon v-else>{{ mdiCircleMedium }}</v-icon>
              <span @click.stop>
                <router-link
                  :to="`/entity/${
                    businessAsRelationship[i + relationshipStartIndex]
                      .related_topic &&
                    businessAsRelationship[i + relationshipStartIndex]
                      .related_topic.source_id
                  }`"
                  class="font-weight-bold"
                  >{{
                    getRelationshipName(
                      businessAsRelationship[i + relationshipStartIndex]
                    )
                  }}</router-link
                >
              </span>
            </div>
          </template>
        </CredentialItem>
      </template>
      <template #footer>
        <div class="pa-5 d-flex align-center justify-center">
          <span class="text-body-2">
            <v-row>
              <v-col class="d-flex align-center justify-center">
                <p class="ma-0">Items displayed</p>
              </v-col>
              <v-col class="py-0 d-flex align-center justify-center">
                <v-select
                  @change="correctRelDisplay"
                  v-model="itemsDisplayed"
                  :items="[5, 10, 25, 100]"
                ></v-select>
              </v-col>
              <v-col class="d-flex align-center justify-center">
                <p class="ma-0">
                  {{ relationshipStartIndex + 1 }} -
                  {{
                    Math.min(
                      Math.min(itemsDisplayed, businessAsRelationship.length) +
                        relationshipStartIndex,
                      businessAsRelationship.length
                    )
                  }}
                  of {{ businessAsRelationship.length }}
                </p>
              </v-col>
              <v-col
                :class="{
                  'd-flex align-center flex-shrink-1': true,
                  'justify-center': !$vuetify.breakpoint.lgAndUp,
                }"
              >
                <v-btn
                  :disabled="relationshipStartIndex <= 0"
                  icon
                  @click="incRelationshipStartIndex(-1)"
                >
                  <v-icon>{{ mdiChevronLeft }}</v-icon>
                </v-btn>
                <v-btn
                  :disabled="
                    relationshipStartIndex + itemsDisplayed >=
                    businessAsRelationship.length
                  "
                  icon
                  @click="incRelationshipStartIndex(1)"
                >
                  <v-icon>{{ mdiChevronRight }}</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </span>
        </div>
      </template>
    </EntityCard>

    <!-- relationships related from -->
    <EntityCard
      ref="relationships"
      :expanded="credentialsExpanded"
      v-if="ownedByRelationship.length > 0"
    >
      <template #title>
        <div class="flex">
          <Dialog>
            <template #activator>
              <span
                class="fake-link text--primary"
                style="text-decoration: none"
              >
                Relationships
                <v-icon class="icon-dense" dense>{{
                  mdiInformationOutline
                }}</v-icon>
              </span>
            </template>
            <template #content>
              <h3>Relationships:</h3>
              <p>
                The organizational connections between this credential and other
                credentials. An example relationship in OrgBook BC is one
                registered organization “Doing Business As” another.
              </p>
            </template>
          </Dialog>
        </div>
      </template>
      <template #subtitle>
        <div class="px-5 mb-n2 text-body-2">
          <p>{{ entityName }} is owned by:</p>
        </div>
      </template>
      <template #expansionPanels>
        <CredentialItem
          v-for="(_, i) in ownedByRelationship"
          :key="i"
          :entityType="entityJurisdiction"
          :cred="credOrRelationshipToDisplay(ownedByRelationship[i], credSet)"
          :disableDefaultHeader="true"
          :effectiveDate="ownedByRelationship[i].credential.effective_date"
        >
          <template #header>
            <span
              v-if="ownedByRelationship[i].credential.revoked"
              class="expired-credential"
            >
              <v-icon>{{ mdiCircleMedium }}</v-icon>
              Credential replaced:
              {{ ownedByRelationship[i].credential.revoked_date | formatDate }}
            </span>

            <v-icon v-else>{{ mdiCircleMedium }}</v-icon>
            <span @click.stop>
              <router-link
                :to="`/entity/${
                  ownedByRelationship[i].related_topic &&
                  ownedByRelationship[i].related_topic.source_id
                }`"
                class="font-weight-bold"
              >
                {{ getRelationshipName(ownedByRelationship[i]) }}
              </router-link>
            </span>
          </template>
        </CredentialItem>
      </template>
    </EntityCard>

    <!-- credential timeline -->
    <EntityCard :expanded="credentialsExpanded" ref="credentials">
      <template #title>
        <div class="flex">Credentials</div>
      </template>
      <template>
        <!-- header content for the credential card -->
        <v-row>
          <v-col
            class="d-flex justify-start align-end pl-5 pt-0"
            v-if="$vuetify.breakpoint.smAndDown"
          >
            <EntityFilterDialog />
          </v-col>
          <v-col class="d-flex justify-end align-end pr-5 pt-0">
            <div class="text-body-2">
              <span class="fake-link" @click="switchCredentialTimeOrder"
                >Sort by date</span
              >
              <v-icon
                class="icon-dense"
                dense
                v-if="credentialTimeOrder === 1"
                >{{ mdiArrowUp }}</v-icon
              >
              <v-icon class="icon-dense" dense v-else>{{
                mdiArrowDown
              }}</v-icon>
            </div>
          </v-col>
        </v-row>
        <!-- body content of the credential card -->
        <v-row>
          <v-col
            v-if="$vuetify.breakpoint.mdAndUp"
            cols="12"
            md="4"
            class="pa-0"
          >
            <EntityFilterFacetPanels :entityType="entityJurisdiction" />
          </v-col>
          <v-col cols="12" md="8" class="pa-5 pl-3 pt-0">
            <EntityFilterChips class="pb-2" />
            <v-timeline dense align-top class="pa-0">
              <v-timeline-item
                v-for="(cred, i) in filteredEntityCredentials"
                :key="i"
                color="#38598A"
                small
              >
                <div class="pl-3 mt-n3">
                  <div class="text-body-2 font-weight-bold mb-2">
                    {{ cred.date_effective | formatDate }} -
                    <span v-if="cred.revoked">
                      Credential replaced:
                      {{ cred.revoked_date | formatDate }}
                    </span>
                    <span v-else-if="isExpired(cred.attributes)">
                      Credential expired:
                      {{ isExpired(cred.attributes) | formatDate }}
                    </span>
                    <span v-else> Present </span>
                  </div>
                  <EntityCard
                    :expanded="credentialsExpanded"
                    :timeline="true"
                    class="pl-0 timeline-cred"
                  >
                    <template #expansionPanels>
                      <CredentialItem
                        :credential="cred"
                        :entityType="entityJurisdiction"
                        :timeline="true"
                      >
                        <template #header>
                          <div class="text-body-2">
                            <div
                              v-if="cred.registration_reason"
                              class="font-weight-bold"
                              v-translate="
                                toTranslationFormat(
                                  cred.registration_reason,
                                  entityJurisdiction
                                )
                              "
                            ></div>
                            <div
                              v-else-if="
                                cred.relationship_types &&
                                cred.relationship_types.length
                              "
                            >
                              <div class="font-weight-bold">
                                DBA name registered
                              </div>
                            </div>
                            <div v-else>
                              <div class="font-weight-bold">
                                {{ getCredentialLabel(cred) }}
                              </div>
                            </div>
                          </div>
                        </template>
                      </CredentialItem>
                    </template>
                  </EntityCard>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-col>
        </v-row>
      </template>
    </EntityCard>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { VuetifyGoToTarget } from "vuetify/types/services/goto";
import { mapActions, mapGetters } from "vuex";
import { mapActions as pmapActions, mapState } from "pinia";
import { useAppState, useTopicState } from "@/stores";
import moment from "moment";

import {
  ICredential,
  ICredentialDisplayType,
} from "@/interfaces/api/v4/credential.interface";
import { ICredentialSet } from "@/interfaces/api/v2/credential-set.interface";
import {
  IFormattedTopic,
  ITopic,
  ITopicName,
} from "@/interfaces/api/v2/topic.interface";
import { IRelationship } from "@/interfaces/api/v2/relationship.interface";
import { IEntityFilter } from "@/interfaces/entity-filter.interface";
import { IEntityDesc } from "@/interfaces/entity-desc";

import { selectFirstAttrItem } from "@/utils/attribute";
import {
  getRelationshipName,
  credOrRelationshipToDisplay,
  isExpired,
  getCredentialLabel,
  toTranslationFormat,
} from "@/utils/entity";

import BackTo from "@/components/shared/BackTo.vue";
import Dialog from "@/components/shared/Dialog.vue";
import CredentialItem from "@/components/entity/CredentialItem.vue";
import EntityCard from "@/components/entity/EntityCard.vue";
import EntityHeader from "@/components/entity/EntityHeader.vue";
import EntityFilterChips from "@/components/entity/filter/EntityFilterChips.vue";
import EntityFilterFacetPanels from "@/components/entity/filter/EntityFilterFacetPanels.vue";
import EntityFilterDialog from "@/components/entity/filter/EntityFilterDialog.vue";

import { translate } from "@/i18n/translate";

interface Data {
  currentTab: string;
  credentialTimeOrder: number;
  itemsDisplayed: number;
  relationshipStartIndex: number;
  credentialsExpanded: boolean;
}

export default {
  data(): Data {
    return {
      currentTab: "",
      credentialTimeOrder: 1,
      itemsDisplayed: 100,
      relationshipStartIndex: 0,
      credentialsExpanded: false,
    };
  },
  computed: {
    ...mapGetters({
      credentialTypes: "credentialTypes",
      entityDesc: "entityDesc",
      getEntityFilters: "getEntityFilters",
      getRelationships: "getRelationships",
      getScrollY: "getScrollY",
      mdiArrowUp: "mdiArrowUp",
      mdiArrowDown: "mdiArrowDown",
      mdiArrowLeft: "mdiArrowLeft",
      mdiMapMarker: "mdiMapMarker",
      mdiChevronLeft: "mdiChevronLeft",
      mdiChevronRight: "mdiChevronRight",
      mdiCircleMedium: "mdiCircleMedium",
      mdiInformationOutline: "mdiInformationOutline",
    }),
    ...mapState(useAppState, { loading: "getLoading" }),
    ...mapState(useTopicState, ["selectedTopic", "selectedTopicFullCredentialSet"]),
    hasAnyRelationships: function (): boolean {
      return (
        this.businessAsRelationship?.length > 0 ||
          this.ownedByRelationship?.length > 0
      );
    },

    tabItems: function (): { text: string; refname: string }[] {
      let baseTabItems = [
        { text: "Registration", refname: "registration" },
        { text: "Credentials", refname: "credentials" },
      ];
      if (this.hasAnyRelationships) {
        baseTabItems.splice(1, 0, {
          text: "Relationships",
          refname: "relationships",
        });
      }
      return baseTabItems;
    },

    businessAsRelationship: function (): IRelationship[] {
      return this.getRelationships.filter(
        (relationship) =>
          selectFirstAttrItem(
            { key: "value", value: "Does Business As" },
            relationship.attributes
          ) !== undefined
      );
    },
    ownedByRelationship: function (): IRelationship[] {
      return this.getRelationships.filter(
        (relationship) =>
          selectFirstAttrItem(
            { key: "value", value: "IsOwned" },
            relationship.attributes
          ) !== undefined
      );
    },
    entityName: function (): string | undefined {
      return selectFirstAttrItem(
        { key: "type", value: "entity_name" },
        this.selectedTopic?.names as ITopicName[]
      )?.text;
    },
    entityNameCredId: function (): number | undefined {
      const ret = selectFirstAttrItem(
        { key: "type", value: "entity_name" },
        this.selectedTopic?.names as ITopicName[]
      )?.credential_id;
      return ret;
    },
    entityBusinessNumber: function (): string | undefined {
      return selectFirstAttrItem(
        { key: "type", value: "business_number" },
        // find the latest business number
        this.entityCredentials
          ?.filter((cred) => cred.latest)
          ?.map((cred) => {
            return {
              type: cred.type,
              text: cred.value,
            };
          })
      )?.text as string;
    },
    entityIncorporationNumber: function (): string | undefined {
      return this.selectedTopic?.source_id;
    },
    filteredEntityCredentials: function (): Array<ICredentialDisplayType> | undefined {
      var filteredCreds = this.entityCredentialsSorted;
      if (filteredCreds === undefined) {
        return undefined;
      }

      this.credentialFilters.forEach((filterFunc) => {
        filteredCreds = filterFunc(filteredCreds as ICredentialDisplayType[]);
      });

      return filteredCreds;
    },
    credSet: function (): ICredential[] | undefined {
      if (!this.selectedTopicFullCredentialSet) {
        return undefined;
      }
      var credentialSet: ICredential[] = [];
      this.selectedTopicFullCredentialSet.forEach((credSet) =>
        credentialSet.push(...credSet.credentials)
      );
      return credentialSet;
    },

    entityCredentials: function (): Array<ICredentialDisplayType> | undefined {
      if (!this.selectedTopicFullCredentialSet) {
        return undefined;
      }

      var fullCredentials: ICredentialDisplayType[] = [];
      this.selectedTopicFullCredentialSet.forEach((credSet) => {
        //filter out all the relationship credentials
        fullCredentials.push(
          ...credSet.credentials
            .filter((cred) => !this.isRelationshipCred(cred))
            .map((cred) => credOrRelationshipToDisplay(cred))
        );
      });
      this.getRelationships.forEach((rel) => {
        fullCredentials.push(credOrRelationshipToDisplay(rel, this.credSet));
      });
      return fullCredentials;
    },

    entityCredentialsSorted: function (): Array<ICredentialDisplayType> | undefined {
      const cpa = (
        item1: ICredentialDisplayType,
        item2: ICredentialDisplayType
      ) => {
        return (
          (moment(item1.date_effective).isBefore(item2.date_effective) ? -1 : 1) *
            this.credentialTimeOrder
        );
      };
      return this.entityCredentials?.sort((cred1, cred2) => {
        return cpa(cred1, cred2);
      });
    },

    entityState: function (): string | undefined {
      if (this.selectedTopic === undefined) {
        return undefined;
      }

      const state = selectFirstAttrItem(
        { key: "type", value: "entity_status" },
        this.selectedTopic?.attributes
      );

      const ret = state?.type + "." + state?.value;
      if (ret.includes("undefined")) {
        return undefined;
      }
      return ret;
    },

    entityRegistrationDate: function (): string | undefined {
      return selectFirstAttrItem(
        { key: "type", value: "registration_date" },
        this.selectedTopic?.attributes
      )?.value;
    },

    entityNameEffectiveDate: function (): string | undefined {
      return selectFirstAttrItem(
        { key: "type", value: "entity_name_effective" },
        this.selectedTopic?.attributes
      )?.value;
    },

    entityStatusEffectiveDate: function (): string | undefined {
      return selectFirstAttrItem(
        { key: "type", value: "entity_status_effective" },
        this.selectedTopic?.attributes
      )?.value;
    },

    entityJurisdiction: function (): string | undefined {
      const state = selectFirstAttrItem(
        { key: "type", value: "entity_type" },
        this.selectedTopic?.attributes
      );
      const ret = "entity_type." + state?.value;
      if (ret.includes("undefined")) {
        return undefined;
      }
      return ret;
    },

    entityRegistrationIssuer: function (): string | undefined {
      return selectFirstAttrItem(
        { key: "type", value: "entity_name" },
        this.selectedTopic?.names
      )?.issuer?.name;
    },

    entityRegistrationIssuerUrl: function (): string | URL | undefined {
      const ret = selectFirstAttrItem(
        { key: "type", value: "entity_name" },
        this.selectedTopic?.names
      )?.issuer?.url;
      return ret;
    },
    credentialFilters: function (): {
      (creds: Array<ICredentialDisplayType>): Array<ICredentialDisplayType>;
    }[] {
      return [
        this.applyDateFilter,
        this.applyExpiredFilter,
        this.applyCredentialTypeFilter,
        this.applyIssuerFilter,
        this.applyRegistrationTypeFilter,
      ]
    },

  },
  methods: {
    ...mapActions({
      fetchCredentialTypes: "fetchCredentialTypes",
      setCredentialType: "setCredentialType",
      setEntityDesc: "setEntityDesc",
      setRegistrationType: "setRegistrationType",
      setIssuers: "setIssuers",
      fetchRelationships: "fetchRelationships",
    }),
    ...pmapActions(useAppState, ["setLoading"]),
    ...pmapActions(useTopicState, ["fetchFormattedIdentifiedTopic", "fetchTopicFullCredentialSet"]),
    credOrRelationshipToDisplay,
    getRelationshipName,
    getCredentialLabel,
    toTranslationFormat,
    isExpired,
    loadingCallBack(): void {
      if (
        this.selectedTopicFullCredentialSet &&
          this.entityCredentials !== undefined
      ) {
        this.setCredentialType(this.entityCredentials);
        this.setRegistrationType(this.entityCredentials);
        this.setIssuers(this.entityCredentials);
      }
      if (this.entityJurisdiction) {
        //convert entity type to file name
        let fileName = this.$t(this.entityJurisdiction) as string;
        let displayName = undefined;
        if (fileName !== this.entityJurisdiction) {
          // translation success
          displayName = fileName;
        }

        // get the entity code, ex: BC, A, SP, etc
        const codeSplit = this.entityJurisdiction.split(".");
        const code = codeSplit[codeSplit.length - 1];

        // convert to markdown file name
        fileName = fileName.toLowerCase().replace(" ", "-");

        this.setEntityDesc({ code, fileName, displayName });
      }
      if (this.getScrollY) {
        this.$vuetify.goTo(this.getScrollY, { duration: 0 });
      }
    },
    toggleCredentialsExpanded(): void {
      this.credentialsExpanded = !this.credentialsExpanded;
    },
    applyIssuerFilter(creds: Array<ICredentialDisplayType>) {
      let filteredCreds = [...creds];
      if ((this.getEntityFilters.authorities as string[]).length <= 0) {
        return filteredCreds;
      }
      return filteredCreds.filter((cred) =>
        (this.getEntityFilters.authorities as string[]).includes(cred.authority)
      );
    },
    applyCredentialTypeFilter(
      creds: Array<ICredentialDisplayType>
    ): Array<ICredentialDisplayType> {
      let filteredCreds = [...creds];
      if ((this.getEntityFilters.credential_type as string[]).length <= 0) {
        return filteredCreds;
      }
      return filteredCreds.filter((cred) =>
        (this.getEntityFilters.credential_type as string[]).includes(
          getCredentialLabel(cred)
        )
      );
    },
    applyRegistrationTypeFilter(
      creds: Array<ICredentialDisplayType>
    ): Array<ICredentialDisplayType> {
      let filteredCreds = [...creds];
      if ((this.getEntityFilters.registration_type as string[]).length <= 0) {
        return filteredCreds;
      }
      return filteredCreds.filter(
        (cred) =>
          cred.registration_reason !== undefined &&
            (this.getEntityFilters.registration_type as string[]).includes(
              cred.registration_reason
            )
      );
    },
    applyDateFilter(
      creds: Array<ICredentialDisplayType>
    ): Array<ICredentialDisplayType> {
      let filteredCreds = [...creds];

      if (this.getEntityFilters.date_min !== "") {
        filteredCreds = filteredCreds.filter((cred) => {
          //take the negative condition so we don't have to do another check with isSame
          return !moment(this.getEntityFilters.date_min as string).isAfter(
            cred.date_effective
          );
        });
      }

      if (this.getEntityFilters.date_max !== "") {
        filteredCreds = filteredCreds.filter((cred) => {
          return !moment(this.getEntityFilters.date_max as string).isBefore(
            cred.date_effective
          );
        });
      }
      return filteredCreds;
    },
    applyExpiredFilter(
      creds: Array<ICredentialDisplayType>
    ): Array<ICredentialDisplayType> {
      let filteredCreds = [...creds];
      if (!this.getEntityFilters.show_expired) {
        filteredCreds = creds.filter(
          (cred) => !cred.revoked && !this.isExpired(cred.attributes)
        );
      }
      return filteredCreds;
    },

    tabClick(refname: string): void {
      this.$vuetify.goTo(this.$refs[refname] as VuetifyGoToTarget, {
        duration: 500,
        easing: "easeInOutCubic",
      });
    },

    incRelationshipStartIndex(num: number): void {
      const interval = Math.min(
        this.businessAsRelationship.length,
        this.itemsDisplayed
      );
      if (
        this.relationshipStartIndex + num * interval >= 0 &&
          this.relationshipStartIndex + num * interval <
            this.businessAsRelationship.length
      )
        this.relationshipStartIndex += num * interval;
    },

    correctRelDisplay(): void {
      // deal with issue of switching display intervals in the middle of a set
      if (this.relationshipStartIndex % this.itemsDisplayed) {
        this.relationshipStartIndex =
                                Math.floor(this.relationshipStartIndex / this.itemsDisplayed) *
                                  this.itemsDisplayed;
      }
      //refocus relationships on selection change
      this.$vuetify.goTo(this.$refs["relationships"] as VuetifyGoToTarget, {
        duration: 500,
        easing: "easeInOutCubic",
      });
    },

    switchCredentialTimeOrder(): void {
      this.credentialTimeOrder *= -1;
    },

    isRelationshipCred(cred: ICredential): boolean {
      return cred.credential_type.description === "relationship.registries.ca";
    },

    entityTypeToRegValue(entityType: string): string {
      const entityTypeTable: Record<string, string> = {
        "BC Company": "Incorporation number",
        "BC Corporation": "Incorporation number",
        Society: "Incorporation number",
        Cooperative: "Incorporation number",
        "Sole Proprietorship": "Registration number",
        "General Partnership": "Registration number",
        "Limited Partnership": "Registration number",
        "Extraprovincial Limited Partnership": "Registration number",
        "Limited Liability Partnership": "Registration number",
        "Extrapro Limited Liability Partnership": "Registration number",
        "Miscellaneous Firm": "Registration number",
      };
      return entityTypeTable[entityType] !== undefined
        ? entityTypeTable[entityType]
        : entityType;
    },
    async reload(): Promise<void> {
      this.setLoading(true);
      const { sourceId, type } = this.$route.params;

      if (sourceId && type) {
        await this.fetchFormattedIdentifiedTopic({
          sourceId,
          type,
        });
        if (!this.selectedTopic) {
          //sourceid is invalid, go back to search
          console.error("Failed to fetch topic. Invalid source id");
          this.$router.push("/");
        }
        const topic: ITopic = this.$store.getters.selectedTopic;
        if (topic?.id) {
          console.log("relationships")
          await Promise.all([
            this.fetchRelationships(topic.id),
            this.fetchTopicFullCredentialSet(topic.id),
            this.fetchCredentialTypes(false),
          ]);
        }
      }
      this.setLoading(false);
      this.loadingCallBack();
    },
  },
  async created(): Promise<void> {
    await this.reload();
  },
  directives: {
    translate,
  },
  watch: {
    async onRouteParamsChanged(params: any): Promise<void> {
      if (params.sourceId) {
        this.reload();
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.show-all-statuses {
  cursor: pointer;
  text-decoration: underline;
  color: $input-color;
}

.tab-active {
  border-bottom: 5px solid $secondary-color;
}

.expired-credential {
  color: $error-color;
}

.progress {
  color: $secondary-color;
}

.flex {
  display: flex;
}
</style>
